import { createHmac, randomBytes } from "crypto";
import { kv, safe } from "@/lib/kv";

// Owner notifications and quick actions through a Telegram bot (TELEGRAM_BOT_TOKEN).
// The bot talks to exactly one chat: the one that sent the one-time link code from /admin.
// Incoming updates are verified with Telegram's secret-token header; everything else is ignored.

const K = { chat: "tn:tg:chat", link: "tn:tg:link" };

export const tgConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

/** The secret Telegram echoes back in X-Telegram-Bot-Api-Secret-Token on every webhook call. */
export function webhookSecret(): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update("telegram-webhook").digest("hex").slice(0, 48);
}

export async function tgApi<T = unknown>(method: string, body: Record<string, unknown> = {}): Promise<{ ok: boolean; result?: T; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN is not set" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return await res.json();
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : "request failed" };
  }
}

export const getChatId = () => safe(() => kv().get(K.chat), null);

export type Buttons = { text: string; data: string }[][];

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends to the linked owner chat. Never throws — notifications must not break the request that triggered them. */
export async function notify(html: string, buttons?: Buttons): Promise<boolean> {
  if (!tgConfigured()) return false;
  const chat = await getChatId();
  if (!chat) return false;
  const r = await tgApi("sendMessage", {
    chat_id: chat,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) } } : {}),
  });
  return r.ok;
}

/** Sends at most once per `key` within `ttlSeconds` (e.g. one budget warning per month). */
export async function notifyOnce(key: string, ttlSeconds: number, html: string, buttons?: Buttons) {
  const first = await safe(() => kv().set(`tn:tg:once:${key}`, "1", { ex: ttlSeconds, nx: true }), false);
  if (first) await notify(html, buttons);
}

// ─── Linking ────────────────────────────────────────────────────────────────

export async function getBotUsername(): Promise<string | null> {
  const r = await tgApi<{ username: string }>("getMe");
  return r.ok && r.result ? r.result.username : null;
}

/** Creates a one-time code and points Telegram's webhook at this deployment. */
export async function startLink(origin: string): Promise<{ code: string; username: string | null; webhook: { ok: boolean; description?: string } }> {
  const code = `tn-${randomBytes(4).toString("hex")}`;
  await kv().set(K.link, code, { ex: 15 * 60 });
  const webhook = await tgApi("setWebhook", {
    url: `${origin}/api/telegram`,
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  return { code, username: await getBotUsername(), webhook };
}

/** Called by the webhook with the payload of "/start <code>". */
export async function completeLink(code: string, chatId: number): Promise<boolean> {
  const expected = await kv().get(K.link);
  if (!expected || expected !== code) return false;
  await kv().batch().set(K.chat, String(chatId)).del(K.link).exec();
  return true;
}

export async function unlink() {
  await kv().del(K.chat);
  await tgApi("deleteWebhook");
}

export async function webhookInfo() {
  return tgApi<{ url: string; last_error_message?: string; pending_update_count: number }>("getWebhookInfo");
}
