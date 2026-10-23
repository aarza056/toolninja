import { revalidatePath } from "next/cache";
import { completeLink, getChatId, tgApi, webhookSecret, esc } from "@/lib/telegram";
import { safeEqual } from "@/lib/admin-session";
import { getSettings, saveSettings } from "@/lib/site-settings";
import { getDays, monthKey, usd } from "@/lib/ninja-stats";
import { clearSpikeAlert, countReviews, setReviewStatus } from "@/lib/reviews";
import { bumpSessionVersion } from "@/lib/two-factor";
import { kv, safe } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Update {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number; text?: string } };
}

const HELP = `<b>ToolNinja admin bot</b>
/status — today at a glance
/ninja on · /ninja off — switch Ninja AI
/pause · /resume — new comments
/help — this list`;

async function statusText(): Promise<string> {
  const [s, [today], pending, bugs, month] = await Promise.all([
    getSettings(),
    getDays(1),
    countReviews("pending"),
    countReviews("bug"),
    safe(() => kv().get(monthKey()), "0"),
  ]);
  const monthMicro = Number(month ?? 0);
  return [
    `<b>ToolNinja · ${today.date}</b>`,
    `🤖 Ninja AI: ${s.aiEnabled ? "on" : "<b>off</b>"} · ${today.requests}/${s.aiDailyCap} questions today`,
    `💵 AI today ${usd(today.costMicro)} · this month ${usd(monthMicro)}${s.aiMonthlyBudgetMicro ? ` of ${usd(s.aiMonthlyBudgetMicro)}` : ""}`,
    `💬 ${pending} review${pending === 1 ? "" : "s"} to approve · ${bugs} bug report${bugs === 1 ? "" : "s"}`,
    `🧹 Comments: ${s.commentsPaused ? "<b>paused</b>" : "open"}`,
  ].join("\n");
}

async function runAction(data: string): Promise<string> {
  const [kind, action, id] = data.split(":");
  if (kind === "rv" && /^[0-9a-f]{16}$/.test(id ?? "")) {
    const to = action === "pub" ? "published" : action === "rej" ? "rejected" : action === "bug" ? "bug" : null;
    if (!to) return "Unknown action";
    await setReviewStatus(id, to);
    return to === "published" ? "✅ Approved — it's live" : to === "rejected" ? "❌ Rejected" : "🐞 Moved to bug reports";
  }
  if (kind === "ninja") {
    await saveSettings({ aiEnabled: action === "on" });
    return action === "on" ? "🤖 Ninja AI switched on" : "⏸ Ninja AI switched off";
  }
  if (kind === "cm") {
    await saveSettings({ commentsPaused: action === "pause" });
    if (action === "resume") await clearSpikeAlert();
    return action === "pause" ? "⏸ Comments paused" : "▶️ Comments resumed";
  }
  if (kind === "sess" && action === "revoke") {
    await bumpSessionVersion();
    return "🚪 Signed out everywhere — sign in again (and consider changing the password)";
  }
  return "Unknown action";
}

export async function POST(req: Request) {
  // Only Telegram knows this secret (we set it with setWebhook)
  const header = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!process.env.TELEGRAM_BOT_TOKEN || !safeEqual(header, webhookSecret())) return new Response("forbidden", { status: 403 });

  const update = (await req.json().catch(() => ({}))) as Update;
  const owner = await getChatId();

  try {
    if (update.message) {
      const chat = update.message.chat.id;
      const text = (update.message.text ?? "").trim();
      const start = text.match(/^\/start\s+(tn-[0-9a-f]{8})$/);
      if (start) {
        const linked = await completeLink(start[1], chat);
        await tgApi("sendMessage", {
          chat_id: chat,
          parse_mode: "HTML",
          text: linked ? `✅ Connected. You'll get ToolNinja alerts here.\n\n${HELP}` : "That link code is invalid or expired — create a new one in Admin → Settings.",
        });
      } else if (owner && String(chat) === owner) {
        const [cmd, arg] = text.toLowerCase().split(/\s+/);
        let reply = HELP;
        if (cmd === "/status") reply = await statusText();
        else if (cmd === "/ninja" && (arg === "on" || arg === "off")) reply = await runAction(`ninja:${arg}`);
        else if (cmd === "/pause") reply = await runAction("cm:pause");
        else if (cmd === "/resume") reply = await runAction("cm:resume");
        await tgApi("sendMessage", { chat_id: chat, parse_mode: "HTML", text: reply });
        revalidatePath("/admin", "layout");
      }
      // anyone else is ignored
    }

    const cb = update.callback_query;
    if (cb) {
      const fromOwner = owner && String(cb.from.id) === owner && String(cb.message?.chat.id) === owner;
      const result = fromOwner && cb.data ? await runAction(cb.data) : "Not allowed";
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: result.slice(0, 190) });
      if (fromOwner && cb.message) {
        await tgApi("editMessageText", {
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: `${esc(cb.message.text ?? "")}\n\n<b>${esc(result)}</b>`,
          parse_mode: "HTML",
        });
        revalidatePath("/admin", "layout");
      }
    }
  } catch (e) {
    console.error("telegram:", e instanceof Error ? e.message : "error");
  }
  // Always 200 so Telegram doesn't retry
  return Response.json({ ok: true });
}
