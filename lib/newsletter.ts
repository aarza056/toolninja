import { randomBytes } from "crypto";
import { kv, safe } from "@/lib/kv";
import { tools } from "@/lib/tools";
import { releases, type Release } from "@/lib/changelog";
import { getPostBySlug } from "@/lib/blog";
import { videosBetween, type Video } from "@/lib/videos";
import { getVideosFresh } from "@/lib/video-store";
import { notify } from "@/lib/telegram";
import { sendEmail, sendBatch, emailConfigured, type OutgoingEmail } from "@/lib/email-send";
import { renderNewsletter, renderConfirmEmail, type DigestItem, type NewsletterContent } from "@/lib/newsletter-template";

// Newsletter subscribers live in our own storage (Upstash Redis), so the list can move to another
// email provider at any time. Only what's needed is kept: address, status, dates, source page and
// a private unsubscribe token. Double opt-in: nothing is sent until the address is confirmed.

export type SubStatus = "pending" | "subscribed" | "unsubscribed" | "bounced" | "complained";

export interface Subscriber {
  email: string;
  status: SubStatus;
  createdAt: number;
  confirmedAt?: number;
  unsubscribedAt?: number;
  confirmSentAt?: number;
  source: string;
  unsubToken: string;
}

export interface SendRecord {
  id: string;
  at: number;
  subject: string;
  recipients: number;
  sent: number;
  failed: number;
  test: boolean;
  errors?: string[];
}

const K = {
  sub: (email: string) => `tn:nl:sub:${email}`,
  index: "tn:nl:subs",
  confirm: (t: string) => `tn:nl:confirm:${t}`,
  unsub: (t: string) => `tn:nl:unsub:${t}`,
  rate: (who: string, bucket: number) => `tn:nl:rl:${who}:${bucket}`,
  sends: "tn:nl:sends",
  lock: "tn:nl:sending",
};

const CONFIRM_TTL = 7 * 86400;
const SIGNUPS_PER_HOUR = 5;
const RESEND_CONFIRM_AFTER_MS = 10 * 60 * 1000;

export const SITE_URL = "https://toolninja.io";

/** Links in emails point at production, except in local/preview runs where they must work there. */
export function siteUrlFor(origin: string | null | undefined): string {
  if (process.env.VERCEL_ENV === "production" || !origin) return SITE_URL;
  try {
    const u = new URL(origin);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : SITE_URL;
  } catch {
    return SITE_URL;
  }
}

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length > 254) return null;
  if (!/^[^\s@"<>(),;:\\[\]]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/.test(email)) return null;
  return email;
}

/** "ashot@gmail.com" → "as•••@gmail.com" for the admin list. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, Math.min(2, local.length))}${"•".repeat(Math.max(1, Math.min(6, local.length - 2)))}@${domain}`;
}

const token = () => randomBytes(24).toString("base64url");

async function getSub(email: string): Promise<Subscriber | null> {
  const raw = await kv().get(K.sub(email));
  return raw ? (JSON.parse(raw) as Subscriber) : null;
}

async function putSub(s: Subscriber) {
  await kv().batch().set(K.sub(s.email), JSON.stringify(s)).zadd(K.index, s.createdAt, s.email).exec();
}

// ─── public flows ────────────────────────────────────────────────────────────

export type SubscribeResult = { ok: true } | { ok: false; reason: "invalid" | "rate_limited" | "unavailable" | "send_failed" };

/**
 * Starts double opt-in. The answer is the same whether or not the address is already on the list,
 * so the form can't be used to find out who subscribed.
 */
export async function subscribe(rawEmail: string, opts: { who: string; source: string; siteUrl: string; now?: number }): Promise<SubscribeResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid" };
  const now = opts.now ?? Date.now();
  const store = kv();
  try {
    const bucket = Math.floor(now / 3600000);
    const [count] = (await store.batch().incr(K.rate(opts.who, bucket)).expire(K.rate(opts.who, bucket), 3700).exec()) as number[];
    if (Number(count) > SIGNUPS_PER_HOUR) return { ok: false, reason: "rate_limited" };

    const existing = await getSub(email);
    // Already confirmed, or the address bounced / reported spam before: say "check your inbox" and
    // send nothing — mailing them again would hurt deliverability for everyone.
    if (existing && (existing.status === "subscribed" || existing.status === "bounced" || existing.status === "complained")) return { ok: true };
    if (existing?.status === "pending" && existing.confirmSentAt && now - existing.confirmSentAt < RESEND_CONFIRM_AFTER_MS) return { ok: true };

    const sub: Subscriber = existing
      ? { ...existing, status: "pending", confirmSentAt: now, source: existing.source || opts.source }
      : { email, status: "pending", createdAt: now, confirmSentAt: now, source: opts.source.slice(0, 80), unsubToken: token() };
    const confirm = token();
    await store.batch().set(K.confirm(confirm), email, { ex: CONFIRM_TTL }).set(K.unsub(sub.unsubToken), email).exec();
    await putSub(sub);

    const mail = renderConfirmEmail(`${opts.siteUrl}/newsletter/confirm?t=${confirm}`);
    const res = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    if (!res.ok) {
      console.error("newsletter: confirmation email failed:", res.error);
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (e) {
    console.error("newsletter:", e instanceof Error ? e.message : "error");
    return { ok: false, reason: "unavailable" };
  }
}

export async function confirm(tokenValue: string, now = Date.now()): Promise<"confirmed" | "already" | "invalid"> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(tokenValue)) return "invalid";
  const email = await kv().get(K.confirm(tokenValue));
  if (!email) return "invalid";
  const sub = await getSub(email);
  if (!sub) return "invalid";
  await kv().del(K.confirm(tokenValue));
  if (sub.status === "subscribed") return "already";
  await putSub({ ...sub, status: "subscribed", confirmedAt: now, unsubscribedAt: undefined });
  const total = await safe(() => countByStatus().then((c) => c.subscribed), 0);
  await safe(() => notify(`📬 <b>New newsletter subscriber</b> · ${total} total`), false);
  return "confirmed";
}

export async function subscriberForToken(unsubToken: string): Promise<Subscriber | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(unsubToken)) return null;
  const email = await kv().get(K.unsub(unsubToken));
  return email ? getSub(email) : null;
}

export async function unsubscribe(unsubToken: string, now = Date.now()): Promise<boolean> {
  const sub = await subscriberForToken(unsubToken);
  if (!sub) return false;
  if (sub.status === "subscribed" || sub.status === "pending") await putSub({ ...sub, status: "unsubscribed", unsubscribedAt: now });
  return true;
}

/** From Resend's webhook: hard bounces and spam complaints are never mailed again. */
export async function markUndeliverable(email: string, status: "bounced" | "complained"): Promise<boolean> {
  const sub = await getSub(email.trim().toLowerCase());
  if (!sub) return false;
  await putSub({ ...sub, status });
  if (status === "complained") await safe(() => notify(`⚠️ A newsletter recipient marked the email as spam — they've been removed (${maskEmail(sub.email)}).`), false);
  return true;
}

// ─── admin ───────────────────────────────────────────────────────────────────

export async function listSubscribers(): Promise<Subscriber[]> {
  const emails = await kv().zrevrange(K.index, 0, -1);
  if (!emails.length) return [];
  const b = kv().batch();
  for (const e of emails) b.get(K.sub(e));
  const raw = (await b.exec()) as (string | null)[];
  return raw.filter((r): r is string => typeof r === "string").map((r) => JSON.parse(r) as Subscriber);
}

export async function countByStatus(): Promise<Record<SubStatus, number>> {
  const counts: Record<SubStatus, number> = { pending: 0, subscribed: 0, unsubscribed: 0, bounced: 0, complained: 0 };
  for (const s of await listSubscribers()) counts[s.status]++;
  return counts;
}

/** Removes every trace of an address (a "delete my data" request). */
export async function deleteSubscriber(email: string): Promise<boolean> {
  const sub = await getSub(email.trim().toLowerCase());
  if (!sub) return false;
  await kv().batch().del(K.sub(sub.email)).zrem(K.index, sub.email).del(K.unsub(sub.unsubToken)).exec();
  return true;
}

export function toCsv(subs: Subscriber[]): string {
  const iso = (t?: number) => (t ? new Date(t).toISOString() : "");
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return ["email,status,subscribed_at,confirmed_at,unsubscribed_at,source", ...subs.map((s) => [s.email, s.status, iso(s.createdAt), iso(s.confirmedAt), iso(s.unsubscribedAt), q(s.source)].join(","))].join("\n") + "\n";
}

export async function sendHistory(): Promise<SendRecord[]> {
  return (await safe(() => kv().lrange(K.sends, 0, 19), [] as string[])).map((r) => JSON.parse(r) as SendRecord);
}

// ─── drafting from the changelog ─────────────────────────────────────────────

const toolBySlug = new Map(tools.map((t) => [t.slug, t]));

export function digestItems(release: Release, siteUrl = SITE_URL, videos: Video[] = []): DigestItem[] {
  const items: DigestItem[] = [];
  for (const i of release.items) {
    if (i.kind === "new" && i.tool) {
      const t = toolBySlug.get(i.tool);
      if (t) items.push({ kind: "new", title: t.name, text: i.text ?? t.description, url: `${siteUrl}/tools/${t.slug}` });
    } else if (i.kind === "improved" && i.tool) {
      const t = toolBySlug.get(i.tool);
      if (t) items.push({ kind: "improved", title: t.name, text: i.text ?? t.description, url: `${siteUrl}/tools/${t.slug}` });
    } else if (i.kind === "guide" && i.post) {
      const p = getPostBySlug(i.post);
      if (p) items.push({ kind: "guide", title: p.title, text: p.description, url: `${siteUrl}/blog/${i.post}` });
    }
  }
  // Videos published since the previous release (for the latest release: up to now), linked to the page that plays them
  const idx = releases.findIndex((r) => r.date === release.date);
  for (const v of idx < 0 ? [] : videosBetween(videos, releases[idx + 1]?.date, idx > 0 ? release.date : undefined)) {
    items.push({ kind: "video", title: v.title, text: v.description, url: `${siteUrl}${v.page}` });
  }
  return items;
}

export function draftFromRelease(release: Release = releases[0]): Omit<NewsletterContent, "items"> & { releaseDate: string } {
  return {
    releaseDate: release.date,
    subject: `New on ToolNinja: ${release.title}`,
    preheader: release.summary,
    intro: `Hi there 👋\n\n${release.summary} Here's what's new:`,
  };
}

/** `videos` can be passed in when building many emails at once, so the list is read only once */
export async function buildEmail(content: Omit<NewsletterContent, "items">, releaseDate: string, unsubscribeUrl: string, siteUrl = SITE_URL, videos?: Video[]) {
  const release = releases.find((r) => r.date === releaseDate) ?? releases[0];
  return renderNewsletter({ ...content, items: digestItems(release, siteUrl, videos ?? (await getVideosFresh())) }, { siteUrl, unsubscribeUrl, postalAddress: process.env.NEWSLETTER_POSTAL_ADDRESS });
}

// ─── sending ─────────────────────────────────────────────────────────────────

function unsubscribeHeaders(unsubToken: string, siteUrl: string): Record<string, string> {
  // RFC 8058 one-click: Gmail and Yahoo show their own "Unsubscribe" button and POST to this URL
  return {
    "List-Unsubscribe": `<${siteUrl}/api/newsletter/unsubscribe?t=${unsubToken}>, <mailto:info@toolninja.io?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

async function record(r: SendRecord) {
  await safe(() => kv().batch().lpush(K.sends, JSON.stringify(r)).ltrim(K.sends, 0, 49).exec(), []);
}

export async function sendTest(content: Omit<NewsletterContent, "items">, releaseDate: string, to: string, siteUrl = SITE_URL): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(to);
  if (!email) return { ok: false, error: "That isn't a valid email address." };
  const { html, text } = await buildEmail(content, releaseDate, `${siteUrl}/newsletter/unsubscribe?t=TEST`, siteUrl);
  const res = await sendEmail({ to: email, subject: `[Test] ${content.subject}`, html, text });
  await record({ id: token().slice(0, 10), at: Date.now(), subject: content.subject, recipients: 1, sent: res.ok ? 1 : 0, failed: res.ok ? 0 : 1, test: true, errors: res.error ? [res.error] : undefined });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function sendToAll(content: Omit<NewsletterContent, "items">, releaseDate: string, expectedRecipients: number, siteUrl = SITE_URL): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> {
  if (!emailConfigured()) return { ok: false, sent: 0, failed: 0, error: "RESEND_API_KEY is not set." };
  const recipients = (await listSubscribers()).filter((s) => s.status === "subscribed");
  // The admin confirmed a specific number; if the list changed meanwhile, ask again
  if (recipients.length !== expectedRecipients) return { ok: false, sent: 0, failed: 0, error: `The list changed (${recipients.length} subscribers now). Check and send again.` };
  if (!recipients.length) return { ok: false, sent: 0, failed: 0, error: "No confirmed subscribers yet." };
  const locked = await kv().set(K.lock, "1", { ex: 15 * 60, nx: true });
  if (!locked) return { ok: false, sent: 0, failed: 0, error: "A send is already running." };
  try {
    const id = token().slice(0, 10);
    const videos = await getVideosFresh();
    const emails: OutgoingEmail[] = await Promise.all(
      recipients.map(async (s) => {
        const { html, text } = await buildEmail(content, releaseDate, `${siteUrl}/newsletter/unsubscribe?t=${s.unsubToken}`, siteUrl, videos);
        return { to: s.email, subject: content.subject, html, text, headers: unsubscribeHeaders(s.unsubToken, siteUrl) };
      })
    );
    const r = await sendBatch(emails, `tn-nl-${id}`);
    await record({ id, at: Date.now(), subject: content.subject, recipients: recipients.length, sent: r.sent, failed: r.failed, test: false, errors: r.errors.length ? r.errors : undefined });
    await safe(() => notify(`📨 <b>Newsletter sent</b> — ${r.sent} delivered to Resend${r.failed ? `, ${r.failed} failed` : ""}\n“${content.subject}”`), false);
    return { ok: r.failed === 0, sent: r.sent, failed: r.failed, error: r.errors[0] };
  } finally {
    await kv().del(K.lock);
  }
}
