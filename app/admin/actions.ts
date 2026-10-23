"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { saveSettings } from "@/lib/site-settings";
import {
  clearSpikeAlert,
  listReviews,
  resolveHeld,
  setReviewStatus,
  setReviewReply,
  setBugState,
  isTool,
  type ReviewStatus,
  type BugState,
} from "@/lib/reviews";
import { askNinja, MAX_QUESTION_CHARS } from "@/lib/ninja-ask";
import { costMicro, recordExtraCost } from "@/lib/ninja-stats";
import { startSetup, confirmSetup, verifyCode, disableTwoFactor, regenerateBackupCodes, bumpSessionVersion } from "@/lib/two-factor";
import { notify, startLink, tgConfigured, unlink } from "@/lib/telegram";
import { saveBanner, saveFlags, FEATURE_FLAGS, type FeatureFlag, type Flags } from "@/lib/site-config";
import { updateIdea, mergeIdeas, IDEA_STATUSES, type IdeaStatus } from "@/lib/ideas";

const refresh = () => revalidatePath("/admin", "layout");

// ─── Ninja ──────────────────────────────────────────────────────────────────

export async function saveNinjaSettings(form: FormData) {
  await requireAdmin();
  const cap = Number(form.get("aiDailyCap"));
  const budget = Number(form.get("budget"));
  await saveSettings({
    aiEnabled: form.get("aiEnabled") === "on",
    ...(Number.isFinite(cap) && cap >= 0 ? { aiDailyCap: Math.min(cap, 100000) } : {}),
    ...(Number.isFinite(budget) && budget >= 0 ? { aiMonthlyBudgetMicro: Math.round(Math.min(budget, 1000) * 1e6) } : {}),
  });
  refresh();
}

export async function toggleNinja(form: FormData) {
  await requireAdmin();
  await saveSettings({ aiEnabled: form.get("to") === "on" });
  refresh();
}

export type NinjaTestResult =
  | {
      ok: true;
      answer: string;
      tools: { slug: string; reason: string }[];
      guides: string[];
      topic: string;
      unmet: string;
      usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
      cost: number;
      ms: number;
      model: string;
    }
  | { ok: false; error: string; cost?: number };

export async function testNinja(question: string): Promise<NinjaTestResult> {
  await requireAdmin();
  const q = question.trim().slice(0, MAX_QUESTION_CHARS);
  if (!q) return { ok: false, error: "Type a question first." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "ANTHROPIC_API_KEY is not set." };
  try {
    // Same model call as the live site, but not counted in the stats, the daily cap or the idea board
    const r = await askNinja({ question: q });
    const cost = costMicro(r.usage);
    await recordExtraCost(cost, "testMicro");
    if (r.kind !== "ok") return { ok: false, error: r.kind === "refusal" ? "The model declined to answer." : "The answer couldn't be read.", cost };
    return { ok: true, answer: r.answer, tools: r.tools, guides: r.guides, topic: r.topic, unmet: r.unmet, usage: r.usage, cost, ms: r.ms, model: r.model };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "Request failed" };
  }
}

// ─── Reviews & ratings ──────────────────────────────────────────────────────

const STATUSES: (ReviewStatus | "deleted")[] = ["pending", "bug", "published", "rejected", "deleted"];

export async function reviewAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const to = String(form.get("to") ?? "") as ReviewStatus | "deleted";
  if (/^[0-9a-f]{16}$/.test(id) && STATUSES.includes(to)) await setReviewStatus(id, to);
  refresh();
}

export async function approveAllGenuine() {
  await requireAdmin();
  const pending = await listReviews("pending", 500);
  for (const r of pending) if (r.category === "genuine" && !r.redacted && !r.note.includes("mentions a domain")) await setReviewStatus(r.id, "published");
  refresh();
}

export async function replyAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (/^[0-9a-f]{16}$/.test(id)) await setReviewReply(id, String(form.get("reply") ?? ""));
  refresh();
}

export async function bugStateAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const state = String(form.get("state") ?? "") as BugState;
  if (/^[0-9a-f]{16}$/.test(id) && ["new", "in_progress", "fixed"].includes(state)) {
    const note = form.get("note");
    await setBugState(id, state, typeof note === "string" ? note : undefined);
  }
  refresh();
}

export async function heldAction(form: FormData) {
  await requireAdmin();
  const slug = String(form.get("slug") ?? "");
  if (isTool(slug)) await resolveHeld(slug, form.get("to") === "accept");
  refresh();
}

export async function saveModeration(form: FormData) {
  await requireAdmin();
  const blocklist = String(form.get("blocklist") ?? "")
    .split(/[\n,]/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2)
    .slice(0, 200);
  await saveSettings({
    commentsPaused: form.get("commentsPaused") === "on",
    autoApprove: form.get("autoApprove") === "on",
    blocklist,
  });
  if (form.get("commentsPaused") !== "on") await clearSpikeAlert();
  refresh();
}

export async function dismissSpikeAlert() {
  await requireAdmin();
  await clearSpikeAlert();
  refresh();
}

// ─── Two-step sign-in ───────────────────────────────────────────────────────

export async function startTwoFactor(): Promise<{ secret: string; qrSvg: string }> {
  await requireAdmin();
  return startSetup();
}

export async function confirmTwoFactor(code: string): Promise<{ ok: boolean; codes?: string[] }> {
  await requireAdmin();
  const codes = await confirmSetup(code);
  if (codes) await notify("✅ <b>Two-step sign-in is on</b> for ToolNinja admin.");
  refresh();
  return codes ? { ok: true, codes } : { ok: false };
}

export async function disableTwoFactorAction(code: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!(await verifyCode(code))) return { ok: false };
  await disableTwoFactor();
  await notify("⚠️ <b>Two-step sign-in was turned off</b> for ToolNinja admin.");
  refresh();
  return { ok: true };
}

export async function newBackupCodes(code: string): Promise<{ ok: boolean; codes?: string[] }> {
  await requireAdmin();
  if (!(await verifyCode(code))) return { ok: false };
  return { ok: true, codes: await regenerateBackupCodes() };
}

export async function signOutEverywhere() {
  await requireAdmin();
  await bumpSessionVersion();
  redirect("/admin/login");
}

// ─── Telegram ───────────────────────────────────────────────────────────────

export async function telegramConnect(): Promise<{ ok: boolean; code?: string; username?: string | null; error?: string }> {
  await requireAdmin();
  if (!tgConfigured()) return { ok: false, error: "Add TELEGRAM_BOT_TOKEN in Vercel (and .env.local) first." };
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (proto !== "https" || /^(localhost|127\.)/.test(host)) {
    return { ok: false, error: "Telegram only talks to HTTPS sites — connect from the live site (toolninja.io/admin)." };
  }
  const r = await startLink(`https://${host}`);
  if (!r.webhook.ok) return { ok: false, error: `Telegram refused the webhook: ${r.webhook.description ?? "unknown error"}` };
  return { ok: true, code: r.code, username: r.username };
}

export async function telegramTest(): Promise<{ ok: boolean }> {
  await requireAdmin();
  return { ok: await notify("👋 Test message from ToolNinja admin — notifications are working. Send /status any time.") };
}

export async function telegramDisconnect() {
  await requireAdmin();
  await unlink();
  refresh();
}

// ─── Site banner & feature switches ─────────────────────────────────────────

export async function saveBannerAction(form: FormData) {
  await requireAdmin();
  const tone = String(form.get("tone") ?? "info");
  const href = String(form.get("href") ?? "").trim();
  const until = String(form.get("until") ?? "");
  await saveBanner({
    enabled: form.get("enabled") === "on",
    text: String(form.get("text") ?? "").trim().slice(0, 200),
    linkText: String(form.get("linkText") ?? "").trim().slice(0, 40),
    // internal paths or https links only
    href: /^\/[^/]/.test(href) || /^https:\/\//.test(href) ? href.slice(0, 300) : "",
    tone: tone === "success" || tone === "warning" ? tone : "info",
    until: /^\d{4}-\d{2}-\d{2}$/.test(until) ? new Date(`${until}T23:59:59Z`).toISOString() : "",
  });
  refresh();
}

export async function saveFlagsAction(form: FormData) {
  await requireAdmin();
  const flags: Partial<Flags> = {};
  for (const k of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) flags[k] = form.get(k) === "on";
  await saveFlags(flags);
  refresh();
}

// ─── Ideas ──────────────────────────────────────────────────────────────────

export async function ideaAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as IdeaStatus;
  const title = form.get("title");
  const note = form.get("note");
  await updateIdea(id, {
    ...(IDEA_STATUSES.includes(status) ? { status } : {}),
    ...(typeof title === "string" ? { title } : {}),
    ...(typeof note === "string" ? { note } : {}),
  });
  refresh();
}

export async function mergeIdeasAction(form: FormData) {
  await requireAdmin();
  const target = String(form.get("target") ?? "");
  const sources = form
    .getAll("merge")
    .map(String)
    .filter((s) => s && s !== target);
  if (target && sources.length) await mergeIdeas(target, sources);
  refresh();
}
