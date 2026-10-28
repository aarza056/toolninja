import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

// The webhook route, driven with fake Telegram updates; Telegram's API is a stub that records calls
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: <T>(fn: T) => fn }));

const SECRET = "test-session-secret";
const OWNER = 777;
const calls: { method: string; body: Record<string, unknown> }[] = [];
let POST: (req: Request) => Promise<Response>;
let getSettings: () => Promise<{ aiEnabled: boolean; commentsPaused: boolean }>;

type Keyboard = { inline_keyboard: { text: string; callback_data?: string; url?: string }[][] };
const keyboard = (body: Record<string, unknown>) => (body.reply_markup as Keyboard).inline_keyboard;
const labels = (body: Record<string, unknown>) => keyboard(body).flat().map((b) => b.text);

function update(u: unknown, secret = createHmac("sha256", SECRET).update("telegram-webhook").digest("hex").slice(0, 48)) {
  return POST(new Request("http://localhost/api/telegram", { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret }, body: JSON.stringify(u) }));
}
const message = (text: string, chat = OWNER) => update({ message: { chat: { id: chat }, text } });
const tap = (data: string, from = OWNER) => update({ callback_query: { id: "cb1", data, from: { id: from }, message: { chat: { id: from }, message_id: 5, text: "old" } } });
const sent = (method: string) => calls.filter((c) => c.method === method);

beforeAll(async () => {
  process.env.TELEGRAM_BOT_TOKEN = "123:test";
  process.env.ADMIN_SESSION_SECRET = SECRET;
  vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
    calls.push({ method: String(url).split("/").pop()!, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ ok: true, result: {} }));
  });
  const { kv } = await import("@/lib/kv");
  await kv().set("tn:tg:chat", String(OWNER));
  ({ POST } = await import("@/app/api/telegram/route"));
  ({ getSettings } = await import("@/lib/site-settings"));
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  calls.length = 0;
});

describe("Telegram /menu", () => {
  it("sends the menu with buttons, and registers the commands once", async () => {
    await message("/menu");
    const [menu] = sent("sendMessage");
    expect(menu.body.text).toContain("pick what to see");
    expect(labels(menu.body)).toEqual(["📊 Status", "👥 Visitors", "📄 Pages", "🔗 Referrers", "🌍 Countries", "⏸ Ninja AI off", "⏸ Pause comments", "🛠 Open admin"]);
    expect(keyboard(menu.body).flat().find((b) => b.text === "🛠 Open admin")?.url).toBe("https://toolninja.io/admin");
    expect(sent("setMyCommands")).toHaveLength(1);
    expect((sent("setMyCommands")[0].body.commands as { command: string }[])[0].command).toBe("menu");

    calls.length = 0;
    await message("/start");
    expect(sent("sendMessage")[0].body.text).toContain("pick what to see");
    expect(sent("setMyCommands")).toHaveLength(0);
  });

  it("a list button edits the same message and offers the other periods", async () => {
    await tap("m:pages:30");
    expect(sent("answerCallbackQuery")).toHaveLength(1);
    const [edit] = sent("editMessageText");
    expect(edit.body.message_id).toBe(5);
    // Without VERCEL_API_TOKEN the text explains how to connect analytics
    expect(edit.body.text).toContain("Analytics");
    expect(keyboard(edit.body)[0].map((b) => [b.text, b.callback_data])).toEqual([
      ["Today", "m:pages:1"],
      ["7 days", "m:pages:7"],
      ["• 30 days", "m:pages:30"],
    ]);
  });

  it("toggles act, say what happened, and flip their label", async () => {
    await tap("m:ninja:off");
    expect((await getSettings()).aiEnabled).toBe(false);
    expect(sent("answerCallbackQuery")[0].body.text).toBe("⏸ Ninja AI switched off");
    const [edit] = sent("editMessageText");
    expect(edit.body.text).toContain("Ninja AI switched off");
    expect(labels(edit.body)).toContain("🤖 Ninja AI on");

    calls.length = 0;
    await tap("m:cm:pause");
    expect((await getSettings()).commentsPaused).toBe(true);
    expect(labels(sent("editMessageText")[0].body)).toContain("▶️ Resume comments");

    await tap("m:ninja:on");
    await tap("m:cm:resume");
    expect(await getSettings()).toMatchObject({ aiEnabled: true, commentsPaused: false });
  });

  it("status, visitors and home views keep the menu", async () => {
    for (const data of ["m:status", "m:visitors", "m:home"]) {
      calls.length = 0;
      await tap(data);
      expect(labels(sent("editMessageText")[0].body), data).toContain("📊 Status");
    }
    expect(sent("editMessageText")[0].body.text).toContain("pick what to see");
  });

  it("ignores other people and wrong secrets", async () => {
    await message("/menu", 999);
    expect(sent("sendMessage")).toHaveLength(0);
    await tap("m:ninja:off", 999);
    expect(sent("editMessageText")).toHaveLength(0);
    expect(sent("answerCallbackQuery")[0].body.text).toBe("Not allowed");
    expect((await getSettings()).aiEnabled).toBe(true);
    expect((await update({ message: { chat: { id: OWNER }, text: "/menu" } }, "wrong")).status).toBe(403);
  });

  it("the older buttons on alerts still work", async () => {
    await tap("cm:pause");
    expect(String(sent("editMessageText")[0].body.text)).toContain("Comments paused");
    await tap("cm:resume");
  });
});
