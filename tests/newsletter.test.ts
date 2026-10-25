import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeEmail, maskEmail, subscribe, confirm, unsubscribe, subscriberForToken, markUndeliverable, listSubscribers, sendToAll, sendHistory, deleteSubscriber, toCsv, draftFromRelease, digestItems } from "@/lib/newsletter";
import { renderNewsletter, renderConfirmEmail } from "@/lib/newsletter-template";
import { verifySvix, signSvix } from "@/lib/svix";
import { releases } from "@/lib/changelog";
import { POST as webhook } from "@/app/api/newsletter/webhook/route";
import { POST as unsubscribePost, GET as unsubscribeGet } from "@/app/api/newsletter/unsubscribe/route";

// Storage is the in-memory fallback here (no KV env vars); Resend is faked by stubbing fetch.

interface Sent {
  path: string;
  body: Record<string, unknown> | Record<string, unknown>[];
}
let sent: Sent[] = [];

function fakeResend(status = 200) {
  sent = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
      const body = JSON.parse(String(init?.body));
      sent.push({ path: url.pathname, body });
      if (status !== 200) return new Response(JSON.stringify({ message: "domain not verified" }), { status });
      return new Response(JSON.stringify(url.pathname.endsWith("/batch") ? { data: body.map((_: unknown, i: number) => ({ id: `e${i}` })) } : { id: "e1" }), { status: 200 });
    })
  );
}

const SITE = "https://toolninja.io";
let n = 0;
const fresh = () => `user${++n}.${Date.now()}@example.com`;
const confirmToken = () => {
  const html = String((sent[sent.length - 1].body as Record<string, unknown>).html);
  return /newsletter\/confirm\?t=([A-Za-z0-9_-]+)/.exec(html)![1];
};

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  fakeResend();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("addresses", () => {
  it("normalizes and validates", () => {
    expect(normalizeEmail("  Ashot@Example.COM ")).toBe("ashot@example.com");
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail("no spaces@example.com")).toBeNull();
    expect(normalizeEmail("x@" + "a".repeat(250) + ".com")).toBeNull();
    expect(maskEmail("ashot@gmail.com")).toBe("as•••@gmail.com");
  });
});

describe("double opt-in", () => {
  it("subscribe → confirmation email → confirm → subscribed", async () => {
    const email = fresh();
    expect(await subscribe(email, { who: "v1", source: "home", siteUrl: SITE })).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    const msg = sent[0].body as Record<string, unknown>;
    expect(msg.to).toEqual([email]);
    expect(msg.subject).toBe("Confirm your ToolNinja subscription");
    expect((await listSubscribers()).find((s) => s.email === email)!.status).toBe("pending");

    const t = confirmToken();
    expect(await confirm(t)).toBe("confirmed");
    expect((await listSubscribers()).find((s) => s.email === email)!.status).toBe("subscribed");
    expect(await confirm(t)).toBe("invalid"); // single use
  });

  it("doesn't reveal or re-mail existing subscribers, and throttles repeat confirmations", async () => {
    const email = fresh();
    await subscribe(email, { who: "v2", source: "home", siteUrl: SITE });
    await subscribe(email, { who: "v2", source: "home", siteUrl: SITE });
    expect(sent).toHaveLength(1); // second request within 10 minutes sends nothing
    await confirm(confirmToken());
    expect(await subscribe(email, { who: "v2", source: "home", siteUrl: SITE })).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
  });

  it("rate-limits signups per visitor", async () => {
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await subscribe(fresh(), { who: "flood", source: "home", siteUrl: SITE }));
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("rejects invalid addresses and reports send failures", async () => {
    expect(await subscribe("nope", { who: "v3", source: "home", siteUrl: SITE })).toEqual({ ok: false, reason: "invalid" });
    fakeResend(403);
    expect(await subscribe(fresh(), { who: "v3", source: "home", siteUrl: SITE })).toEqual({ ok: false, reason: "send_failed" });
  });
});

describe("unsubscribe, bounces and deletion", () => {
  it("token unsubscribes; bounced addresses are never mailed again", async () => {
    const email = fresh();
    await subscribe(email, { who: "v4", source: "tool/x", siteUrl: SITE });
    await confirm(confirmToken());
    const sub = (await listSubscribers()).find((s) => s.email === email)!;
    expect((await subscriberForToken(sub.unsubToken))!.email).toBe(email);
    expect(await unsubscribe(sub.unsubToken)).toBe(true);
    expect((await subscriberForToken(sub.unsubToken))!.status).toBe("unsubscribed");
    expect(await unsubscribe("not-a-real-token-at-all-xyz")).toBe(false);

    const bounced = fresh();
    await subscribe(bounced, { who: "v5", source: "home", siteUrl: SITE });
    await markUndeliverable(bounced, "bounced");
    sent = [];
    await subscribe(bounced, { who: "v5", source: "home", siteUrl: SITE });
    expect(sent).toHaveLength(0);
  });

  it("delete removes every trace; CSV export", async () => {
    const email = fresh();
    await subscribe(email, { who: "v6", source: "blog/x", siteUrl: SITE });
    const csv = toCsv((await listSubscribers()).filter((s) => s.email === email));
    expect(csv).toMatch(new RegExp(`^email,status.*\\n${email.replace(/\./g, "\\.")},pending,`, "s"));
    const token = (await listSubscribers()).find((s) => s.email === email)!.unsubToken;
    expect(await deleteSubscriber(email)).toBe(true);
    expect((await listSubscribers()).some((s) => s.email === email)).toBe(false);
    expect(await subscriberForToken(token)).toBeNull();
  });
});

describe("routes", () => {
  it("one-click unsubscribe (RFC 8058) works; GET only redirects", async () => {
    const email = fresh();
    await subscribe(email, { who: "v7", source: "home", siteUrl: SITE });
    await confirm(confirmToken());
    const { unsubToken } = (await listSubscribers()).find((s) => s.email === email)!;

    const get = unsubscribeGet(new Request(`${SITE}/api/newsletter/unsubscribe?t=${unsubToken}`));
    expect(get.status).toBe(303);
    expect((await subscriberForToken(unsubToken))!.status).toBe("subscribed");

    const res = await unsubscribePost(
      new Request(`${SITE}/api/newsletter/unsubscribe?t=${unsubToken}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" })
    );
    expect(res.status).toBe(200);
    expect((await subscriberForToken(unsubToken))!.status).toBe("unsubscribed");
  });

  it("webhook: signed bounce removes the address, bad signatures are refused", async () => {
    const secret = "whsec_" + Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
    vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
    const email = fresh();
    await subscribe(email, { who: "v8", source: "home", siteUrl: SITE });
    const body = JSON.stringify({ type: "email.bounced", data: { to: [email], bounce: { type: "Permanent" } } });
    const ts = String(Math.floor(Date.now() / 1000));
    const ok = await webhook(new Request(`${SITE}/api/newsletter/webhook`, { method: "POST", body, headers: { "svix-id": "msg_1", "svix-timestamp": ts, "svix-signature": signSvix(secret, "msg_1", ts, body) } }));
    expect(ok.status).toBe(200);
    expect((await listSubscribers()).find((s) => s.email === email)!.status).toBe("bounced");
    const bad = await webhook(new Request(`${SITE}/api/newsletter/webhook`, { method: "POST", body, headers: { "svix-id": "msg_1", "svix-timestamp": ts, "svix-signature": "v1,AAAA" } }));
    expect(bad.status).toBe(401);
  });
});

describe("svix signatures", () => {
  const secret = "whsec_" + Buffer.from("secret-key-bytes-for-testing!!").toString("base64");
  it("accepts valid, rejects tampered or stale", () => {
    const ts = "1761300000";
    const sig = signSvix(secret, "id1", ts, "{}");
    expect(verifySvix(secret, { id: "id1", timestamp: ts, signature: `v1,bogus ${sig}` }, "{}", 1761300000_000)).toBe(true);
    expect(verifySvix(secret, { id: "id1", timestamp: ts, signature: sig }, "{ }", 1761300000_000)).toBe(false);
    expect(verifySvix(secret, { id: "id1", timestamp: ts, signature: sig }, "{}", 1761300000_000 + 3600_000)).toBe(false);
  });
});

describe("templates and sending", () => {
  it("draft and items come from the newest changelog release", () => {
    const d = draftFromRelease();
    expect(d.subject).toBe(`New on ToolNinja: ${releases[0].title}`);
    const items = digestItems(releases[0]);
    expect(items.filter((i) => i.kind === "new").length).toBe(releases[0].items.filter((i) => i.kind === "new").length);
    expect(items.every((i) => i.url.startsWith("https://toolninja.io/"))).toBe(true);
  });

  it("escapes the intro and includes unsubscribe links in HTML and text", () => {
    const { html, text } = renderNewsletter(
      { subject: "s", preheader: "p", intro: "Hi <script>alert(1)</script>\n\nSecond para", items: [{ kind: "new", title: "Tool & Co", text: "desc", url: "https://toolninja.io/tools/x" }] },
      { siteUrl: SITE, unsubscribeUrl: `${SITE}/newsletter/unsubscribe?t=abc`, postalAddress: "PO Box 1, Yerevan" }
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Tool &amp; Co");
    expect(html).toContain(`${SITE}/newsletter/unsubscribe?t=abc`);
    expect(html).toContain("PO Box 1, Yerevan");
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(text).toContain(`Unsubscribe: ${SITE}/newsletter/unsubscribe?t=abc`);
    expect(renderConfirmEmail(`${SITE}/newsletter/confirm?t=x`).text).toContain(`${SITE}/newsletter/confirm?t=x`);
  });

  it("sends to confirmed subscribers only, each with their own unsubscribe link and one-click headers", async () => {
    // Fresh confirmed subscriber plus everyone confirmed by earlier tests
    const email = fresh();
    await subscribe(email, { who: "v9", source: "home", siteUrl: SITE });
    await confirm(confirmToken());
    const confirmed = (await listSubscribers()).filter((s) => s.status === "subscribed");
    const draft = draftFromRelease();

    const mismatch = await sendToAll(draft, draft.releaseDate, confirmed.length + 1, SITE);
    expect(mismatch.ok).toBe(false);
    expect(mismatch.error).toMatch(/list changed/);

    sent = [];
    const r = await sendToAll(draft, draft.releaseDate, confirmed.length, SITE);
    expect(r).toMatchObject({ ok: true, sent: confirmed.length, failed: 0 });
    const batch = sent.find((s) => s.path === "/emails/batch")!.body as Record<string, unknown>[];
    expect(batch).toHaveLength(confirmed.length);
    const mine = batch.find((m) => (m.to as string[])[0] === email)!;
    const sub = confirmed.find((s) => s.email === email)!;
    expect(String(mine.html)).toContain(`unsubscribe?t=${sub.unsubToken}`);
    expect((mine.headers as Record<string, string>)["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect((mine.headers as Record<string, string>)["List-Unsubscribe"]).toContain(`/api/newsletter/unsubscribe?t=${sub.unsubToken}`);
    expect((await sendHistory())[0]).toMatchObject({ test: false, sent: confirmed.length });

    // the lock was released, so a second send can run
    sent = [];
    expect((await sendToAll(draft, draft.releaseDate, confirmed.length, SITE)).ok).toBe(true);
  });
});
