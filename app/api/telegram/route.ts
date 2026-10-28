import { revalidatePath } from "next/cache";
import { completeLink, getChatId, tgApi, webhookSecret, esc, inlineKeyboard, type Buttons } from "@/lib/telegram";
import { safeEqual } from "@/lib/admin-session";
import { getSettings, saveSettings } from "@/lib/site-settings";
import { getDays, monthKey, usd } from "@/lib/ninja-stats";
import { clearSpikeAlert, countReviews, setReviewStatus } from "@/lib/reviews";
import { bumpSessionVersion } from "@/lib/two-factor";
import { kv, safe } from "@/lib/kv";
import {
  vercelAnalyticsConfigured,
  VercelAnalyticsError,
  totals,
  top,
  today,
  yesterday,
  lastDays,
  previousDays,
  countryLabel,
  pageLabel,
  referrerLabel,
  change,
  type Dimension,
} from "@/lib/vercel-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Update {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number; text?: string } };
}

const HELP = `<b>ToolNinja admin bot</b>
/menu — buttons for everything below
/status — today at a glance
/visitors — visitors today, yesterday, 7 and 30 days
/pages · /referrers · /countries — top 10 (add 1, 7 or 30 for days, e.g. /pages 30)
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

const num = (v: number) => v.toLocaleString("en-US");

async function analyticsText(build: () => Promise<string>): Promise<string> {
  if (!vercelAnalyticsConfigured()) return "Analytics isn't connected yet — add VERCEL_API_TOKEN in Vercel (see Admin → Analytics).";
  try {
    return await build();
  } catch (e) {
    return e instanceof VercelAnalyticsError ? `⚠️ ${esc(e.message)}` : "⚠️ Couldn't reach Vercel's API right now.";
  }
}

const visitorsText = () =>
  analyticsText(async () => {
    const now = Date.now();
    const [t, y, w, prevW, m] = await Promise.all([
      totals(today(now)),
      totals(yesterday(now)),
      totals(lastDays(7, now)),
      totals(previousDays(7, now)),
      totals(lastDays(30, now)),
    ]);
    const c = change(w.visitors, prevW.visitors);
    return [
      `<b>👥 Visitors</b> (UTC days)`,
      `Today: <b>${num(t.visitors)}</b> · ${num(t.pageviews)} views`,
      `Yesterday: ${num(y.visitors)} · ${num(y.pageviews)} views`,
      `7 days: ${num(w.visitors)} · ${num(w.pageviews)} views${c === null ? "" : ` (${c >= 0 ? "▲" : "▼"} ${Math.abs(c)}% vs previous 7)`}`,
      `30 days: ${num(m.visitors)} · ${num(m.pageviews)} views`,
    ].join("\n");
  });

const TOP_LISTS: Record<string, { dimension: Dimension; title: string; label: (v: string) => string }> = {
  "/pages": { dimension: "requestPath", title: "📄 Top pages", label: pageLabel },
  "/referrers": { dimension: "referrerHostname", title: "🔗 Top referrers", label: referrerLabel },
  "/countries": { dimension: "country", title: "🌍 Top countries", label: countryLabel },
};

const topText = (cmd: string, arg?: string) =>
  analyticsText(async () => {
    const list = TOP_LISTS[cmd];
    const days = arg === "1" || arg === "30" ? Number(arg) : 7;
    const rows = await top(list.dimension, days === 1 ? today() : lastDays(days), 10);
    const period = days === 1 ? "today" : `last ${days} days`;
    if (!rows.length) return `<b>${list.title}</b> · ${period}\nNo data yet.`;
    return [`<b>${list.title}</b> · ${period}`, ...rows.map((r, i) => `${i + 1}. ${esc(list.label(r.value))} — <b>${num(r.visitors)}</b> (${num(r.pageviews)} views)`)].join("\n");
  });

// ─── /menu ──────────────────────────────────────────────────────────────────
// One message with buttons; every tap edits that same message, so the menu stays where it is.

const MENU_TEXT = "<b>ToolNinja</b> · pick what to see";
const ADMIN_URL = "https://toolninja.io/admin";
const MENU_LISTS = ["pages", "referrers", "countries"];

async function menuButtons(view?: { list: string; days: number }): Promise<Buttons> {
  const s = await getSettings();
  const rows: Buttons = [];
  if (view) rows.push([1, 7, 30].map((d) => ({ text: `${d === view.days ? "• " : ""}${d === 1 ? "Today" : `${d} days`}`, data: `m:${view.list}:${d}` })));
  rows.push([
    { text: "📊 Status", data: "m:status" },
    { text: "👥 Visitors", data: "m:visitors" },
  ]);
  rows.push([
    { text: "📄 Pages", data: "m:pages:7" },
    { text: "🔗 Referrers", data: "m:referrers:7" },
    { text: "🌍 Countries", data: "m:countries:7" },
  ]);
  // Toggles name the action a tap takes, based on the current state
  rows.push([
    s.aiEnabled ? { text: "⏸ Ninja AI off", data: "m:ninja:off" } : { text: "🤖 Ninja AI on", data: "m:ninja:on" },
    s.commentsPaused ? { text: "▶️ Resume comments", data: "m:cm:resume" } : { text: "⏸ Pause comments", data: "m:cm:pause" },
  ]);
  rows.push([{ text: "🛠 Open admin", url: ADMIN_URL }]);
  return rows;
}

/** What a menu button shows: the message text, its buttons, and a short toast for actions */
async function menuView(data: string): Promise<{ text: string; buttons: Buttons; toast?: string }> {
  const [, what, arg] = data.split(":");
  if (what === "status") return { text: await statusText(), buttons: await menuButtons() };
  if (what === "visitors") return { text: await visitorsText(), buttons: await menuButtons() };
  if (MENU_LISTS.includes(what)) {
    const days = arg === "1" || arg === "30" ? Number(arg) : 7;
    return { text: await topText(`/${what}`, String(days)), buttons: await menuButtons({ list: what, days }) };
  }
  if ((what === "ninja" && (arg === "on" || arg === "off")) || (what === "cm" && (arg === "pause" || arg === "resume"))) {
    const toast = await runAction(`${what}:${arg}`);
    return { text: `<b>${esc(toast)}</b>\n\n${await statusText()}`, buttons: await menuButtons(), toast };
  }
  return { text: MENU_TEXT, buttons: await menuButtons() };
}

const sendMenu = async (chat: number) =>
  tgApi("sendMessage", { chat_id: chat, parse_mode: "HTML", text: MENU_TEXT, reply_markup: inlineKeyboard(await menuButtons()) });

/** Lists /menu and the other commands in Telegram's "/" picker; sent once per version of the list */
async function registerCommands() {
  const first = await safe(() => kv().set("tn:tg:commands:v1", "1", { nx: true }), false);
  if (!first) return;
  await tgApi("setMyCommands", {
    commands: [
      { command: "menu", description: "Buttons for everything" },
      { command: "status", description: "Today at a glance" },
      { command: "visitors", description: "Visitors today, yesterday, 7 and 30 days" },
      { command: "pages", description: "Top pages (add 1, 7 or 30)" },
      { command: "referrers", description: "Top referrers (add 1, 7 or 30)" },
      { command: "countries", description: "Top countries (add 1, 7 or 30)" },
      { command: "help", description: "All commands" },
    ],
  });
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
        await registerCommands();
        const [cmd, arg] = text.toLowerCase().split(/\s+/);
        if (cmd === "/menu" || cmd === "/start") {
          await sendMenu(chat);
          return Response.json({ ok: true });
        }
        let reply = HELP;
        if (cmd === "/status") reply = await statusText();
        else if (cmd === "/visitors") reply = await visitorsText();
        else if (Object.prototype.hasOwnProperty.call(TOP_LISTS, cmd)) reply = await topText(cmd, arg);
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
      if (fromOwner && cb.message && cb.data?.startsWith("m:")) {
        const view = await menuView(cb.data);
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, ...(view.toast ? { text: view.toast.slice(0, 190) } : {}) });
        // Telegram refuses an edit that changes nothing ("message is not modified"); that's fine
        await tgApi("editMessageText", {
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: view.text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: inlineKeyboard(view.buttons),
        });
        if (view.toast) revalidatePath("/admin", "layout");
        return Response.json({ ok: true });
      }
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
