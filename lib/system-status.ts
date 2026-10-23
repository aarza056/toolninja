import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@/lib/kv";
import { MODEL } from "@/lib/ninja-ask";
import { getSettings } from "@/lib/site-settings";
import { twoFactorEnabled, resetOverride, backupCodesLeft } from "@/lib/two-factor";
import { tgConfigured, tgApi, getChatId, webhookInfo } from "@/lib/telegram";
import { vercelAnalyticsConfigured, totals, today } from "@/lib/vercel-analytics";

export type CheckState = "ok" | "warn" | "fail";
export interface Check {
  group: string;
  label: string;
  state: CheckState;
  detail: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<[T | null, number, string | null]> {
  const t = Date.now();
  try {
    return [await fn(), Date.now() - t, null];
  } catch (e) {
    return [null, Date.now() - t, e instanceof Error ? e.message : "error"];
  }
}

export async function runChecks(origin: string): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (group: string, label: string, state: CheckState, detail: string) => checks.push({ group, label, state, detail });

  // Storage
  const store = kv();
  if (!store.persistent) add("Storage", "Upstash Redis", "fail", "Not connected — KV_REST_API_URL / KV_REST_API_TOKEN missing. Data is in memory and resets.");
  else {
    const [v, ms, err] = await timed(async () => {
      await store.set("tn:status:ping", String(Date.now()), { ex: 60 });
      return store.get("tn:status:ping");
    });
    add("Storage", "Upstash Redis", v ? (ms > 800 ? "warn" : "ok") : "fail", v ? `Connected · round trip ${ms} ms` : `Error: ${err}`);
  }

  // AI
  if (!process.env.ANTHROPIC_API_KEY) add("Ninja AI", "Anthropic API key", "fail", "ANTHROPIC_API_KEY is not set.");
  else {
    const [m, ms, err] = await timed(() => new Anthropic().models.retrieve(MODEL));
    add("Ninja AI", "Anthropic API key", m ? "ok" : "fail", m ? `Valid · ${MODEL} reachable (${ms} ms)` : `Rejected: ${err?.slice(0, 120)}`);
  }
  const s = await getSettings();
  add("Ninja AI", "Ninja AI switch", s.aiEnabled ? "ok" : "warn", s.aiEnabled ? "On" : "Switched off in admin");
  add("Ninja AI", "Monthly budget guard", s.aiMonthlyBudgetMicro > 0 ? "ok" : "warn", s.aiMonthlyBudgetMicro > 0 ? `$${(s.aiMonthlyBudgetMicro / 1e6).toFixed(2)} / month` : "No limit set");

  // Security
  const pw = process.env.ADMIN_PASSWORD ?? "";
  add("Security", "Admin password", pw.length >= 16 ? "ok" : pw ? "warn" : "fail", pw ? `${pw.length} characters${pw.length < 16 ? " — use 16 or more" : ""}` : "ADMIN_PASSWORD is not set");
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  add("Security", "Session secret", secret.length >= 32 ? "ok" : "fail", secret.length >= 32 ? `${secret.length} characters` : "ADMIN_SESSION_SECRET missing or too short");
  const tfa = await twoFactorEnabled();
  const backups = tfa ? await backupCodesLeft() : 0;
  add(
    "Security",
    "Two-step sign-in",
    resetOverride() ? "fail" : tfa ? (backups <= 2 ? "warn" : "ok") : "warn",
    resetOverride() ? "ADMIN_2FA_RESET=true is set — codes are being skipped. Remove it." : tfa ? `On · ${backups} backup codes left` : "Off — enable it in Settings"
  );

  // Telegram
  if (!tgConfigured()) add("Telegram", "Bot token", "warn", "TELEGRAM_BOT_TOKEN is not set — no phone alerts.");
  else {
    const me = await tgApi<{ username: string }>("getMe");
    add("Telegram", "Bot token", me.ok ? "ok" : "fail", me.ok ? `@${me.result?.username}` : `Rejected: ${me.description}`);
    const chat = await getChatId();
    add("Telegram", "Linked chat", chat ? "ok" : "warn", chat ? "Connected" : "Not connected — Settings → Telegram");
    const wh = await webhookInfo();
    const url = wh.result?.url ?? "";
    const expected = `${origin}/api/telegram`;
    add(
      "Telegram",
      "Webhook (buttons & commands)",
      !url ? "warn" : url !== expected ? "warn" : wh.result?.last_error_message ? "warn" : "ok",
      !url ? "Not set" : url !== expected ? `Points to ${url}` : wh.result?.last_error_message ? `Last error: ${wh.result.last_error_message}` : "Receiving updates"
    );
  }

  // Analytics & deploy
  if (!vercelAnalyticsConfigured()) add("Site", "Vercel Web Analytics API", "warn", "VERCEL_API_TOKEN is not set — Admin → Analytics and /visitors are off.");
  else {
    const [t, ms, err] = await timed(() => totals(today()));
    add("Site", "Vercel Web Analytics API", t ? "ok" : "fail", t ? `Connected · ${t.visitors} visitors today (${ms} ms)` : err ?? "error");
  }
  add("Site", "Google Analytics ID", process.env.NEXT_PUBLIC_GA_ID ? "ok" : "warn", process.env.NEXT_PUBLIC_GA_ID ? "Set" : "NEXT_PUBLIC_GA_ID is not set");
  add("Site", "Environment", "ok", `${process.env.VERCEL_ENV ?? "local"}${process.env.VERCEL_GIT_COMMIT_REF ? ` · branch ${process.env.VERCEL_GIT_COMMIT_REF}` : ""}${process.env.VERCEL_GIT_COMMIT_SHA ? ` · ${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` : ""}`);
  return checks;
}
