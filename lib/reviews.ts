import { createHash, createHmac, randomBytes } from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { kv, safe, today, DAY } from "@/lib/kv";
import { tools } from "@/lib/tools";
import { scanForSecrets } from "@/lib/secret-scanner";
import { getSettings, saveSettings } from "@/lib/site-settings";
import { costMicro, recordExtraCost } from "@/lib/ninja-stats";
import { notify, esc } from "@/lib/telegram";

// Ratings and comments for tool pages. Anti-spam layers, in order: page token (proves the page was
// loaded and JavaScript ran), honeypot, minimum time on page, origin check (in the route), rate limits,
// content rules, then AI moderation — and nothing is public until approved (or auto-approved).
// Spam is always answered with a normal "thanks", so bots never learn what blocked them.

export const MIN_RATINGS_FOR_STARS = 5;
export const MAX_COMMENT = 500;
const MIN_SECONDS_ON_PAGE = 3;
const TOKEN_MAX_AGE = 2 * 3600;
const RATING_BURST_PER_HOUR = 25; // per tool; more than this is held for review
const COMMENT_SPIKE_PER_HOUR = 40; // site-wide; more than this pauses new comments
const COMMENTS_PER_VISITOR_HOUR = 5;

const toolSlugs = new Set(tools.map((t) => t.slug));
export const isTool = (slug: string) => toolSlugs.has(slug);

export type ReviewStatus = "pending" | "bug" | "published" | "rejected";
export type ReviewCategory = "genuine" | "bug" | "spam" | "abusive" | "unchecked";

export interface Review {
  id: string;
  slug: string;
  stars: number;
  comment: string;
  ts: number;
  status: ReviewStatus;
  category: ReviewCategory;
  note: string; // why it was sorted this way (AI note or rule name)
  redacted: boolean; // a secret was removed before storing
  reply?: { text: string; ts: number }; // public answer from ToolNinja, shown under the comment
  bugState?: BugState; // for bug reports
  bugNote?: string;
}

export type BugState = "new" | "in_progress" | "fixed";

const K = {
  rating: (slug: string) => `tn:rating:${slug}`,
  review: (id: string) => `tn:review:${id}`,
  status: (s: ReviewStatus) => `tn:reviews:${s}`,
  toolPublished: (slug: string) => `tn:reviews:tool:${slug}`,
  voted: (slug: string, v: string) => `tn:voted:${slug}:${v}`,
  burst: (slug: string) => `tn:burst:${slug}:${Math.floor(Date.now() / 3600000)}`,
  held: "tn:ratings:held",
  spamLog: "tn:spam:log",
  spamDay: (d: string) => `tn:spam:day:${d}`,
  commentHour: () => `tn:rl:comments:${Math.floor(Date.now() / 3600000)}`,
  visitorComments: (v: string) => `tn:rl:cm:${v}:${Math.floor(Date.now() / 3600000)}`,
  dup: (h: string) => `tn:dup:${h}`,
  alert: "tn:alert:spike",
};

const secret = () => process.env.ADMIN_SESSION_SECRET || "toolninja-dev-salt";

// ─── Page token ─────────────────────────────────────────────────────────────

export function issueToken(slug: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", secret()).update(`rv|${slug}|${ts}`).digest("hex").slice(0, 32);
  return `${ts}.${sig}`;
}

/** "ok", or the name of the layer that failed. */
export function checkToken(token: unknown, slug: string): "ok" | "token" | "too_fast" {
  if (typeof token !== "string") return "token";
  const [tsStr, sig] = token.split(".");
  const ts = Number(tsStr);
  if (!ts || !sig) return "token";
  const expected = createHmac("sha256", secret()).update(`rv|${slug}|${ts}`).digest("hex").slice(0, 32);
  if (sig.length !== expected.length || sig !== expected) return "token";
  const age = Date.now() / 1000 - ts;
  if (age > TOKEN_MAX_AGE || age < 0) return "token";
  if (age < MIN_SECONDS_ON_PAGE) return "too_fast";
  return "ok";
}

// ─── Spam log ───────────────────────────────────────────────────────────────

export async function logSpam(layer: string, slug: string, excerpt = "") {
  const d = today();
  await safe(
    () =>
      kv()
        .batch()
        .hincrby(K.spamDay(d), layer, 1)
        .expire(K.spamDay(d), 90 * DAY)
        .lpush(K.spamLog, JSON.stringify({ ts: Date.now(), layer, slug, excerpt: excerpt.slice(0, 80) }))
        .ltrim(K.spamLog, 0, 299)
        .exec(),
    []
  );
}

// ─── Ratings ────────────────────────────────────────────────────────────────

async function applyRating(slug: string, stars: number) {
  await kv().batch().hincrby(K.rating(slug), "count", 1).hincrby(K.rating(slug), "sum", stars).hincrby(K.rating(slug), `s${stars}`, 1).exec();
  revalidateTag(`reviews:${slug}`);
}

export async function addRating(slug: string, stars: number, visitor: string): Promise<"ok" | "duplicate" | "held"> {
  const first = await kv().set(K.voted(slug, visitor), String(stars), { ex: DAY, nx: true });
  if (!first) return "duplicate";
  const burst = await kv().incr(K.burst(slug));
  if (burst === 1) await kv().expire(K.burst(slug), 3600);
  if (burst > RATING_BURST_PER_HOUR) {
    await kv()
      .batch()
      .lpush(K.held, JSON.stringify({ id: randomBytes(6).toString("hex"), slug, stars, ts: Date.now() }))
      .ltrim(K.held, 0, 999)
      .exec();
    return "held";
  }
  await applyRating(slug, stars);
  return "ok";
}

export interface HeldRating {
  id: string;
  slug: string;
  stars: number;
  ts: number;
}

export async function getHeldRatings(): Promise<HeldRating[]> {
  return (await safe(() => kv().lrange(K.held, 0, 999), [])).flatMap((r) => {
    try {
      return [JSON.parse(r) as HeldRating];
    } catch {
      return [];
    }
  });
}

/** Accept or reject every held rating for one tool (bursts arrive together, so they're judged together). */
export async function resolveHeld(slug: string, accept: boolean) {
  const all = await getHeldRatings();
  const mine = all.filter((h) => h.slug === slug);
  const rest = all.filter((h) => h.slug !== slug);
  const b = kv().batch().del(K.held);
  if (rest.length) b.lpush(K.held, ...rest.map((h) => JSON.stringify(h)).reverse());
  await b.exec();
  if (accept && mine.length) {
    const ab = kv().batch();
    for (const h of mine) ab.hincrby(K.rating(slug), "count", 1).hincrby(K.rating(slug), "sum", h.stars).hincrby(K.rating(slug), `s${h.stars}`, 1);
    await ab.exec();
    revalidateTag(`reviews:${slug}`);
  }
  return mine.length;
}

export interface RatingSummary {
  count: number;
  avg: number;
  dist: number[]; // index 0 = 1 star
}

function toSummary(r: Record<string, string> | null): RatingSummary {
  const count = Number(r?.count ?? 0);
  const sum = Number(r?.sum ?? 0);
  return { count, avg: count ? sum / count : 0, dist: [1, 2, 3, 4, 5].map((s) => Number(r?.[`s${s}`] ?? 0)) };
}

export async function getAllRatings(): Promise<Map<string, RatingSummary>> {
  const b = kv().batch();
  tools.forEach((t) => b.hgetall(K.rating(t.slug)));
  const rows = (await safe(() => b.exec(), [])) as (Record<string, string> | null)[];
  return new Map(tools.map((t, i) => [t.slug, toSummary(rows[i] ?? null)]));
}

// ─── Public data for tool pages (cached; refreshed when that tool's reviews change) ──

export interface PublicReview {
  id: string;
  stars: number;
  comment: string;
  ts: number;
  reply?: { text: string; ts: number };
}

export interface ToolReviewData extends RatingSummary {
  reviews: PublicReview[];
}

export function getToolReviewData(slug: string): Promise<ToolReviewData> {
  return unstable_cache(
    async (): Promise<ToolReviewData> => {
      const empty: ToolReviewData = { count: 0, avg: 0, dist: [0, 0, 0, 0, 0], reviews: [] };
      return safe(async () => {
        const ids = await kv().zrevrange(K.toolPublished(slug), 0, 9);
        const b = kv().batch().hgetall(K.rating(slug));
        ids.forEach((id) => b.get(K.review(id)));
        const [rating, ...raw] = await b.exec();
        const reviews = (raw as (string | null)[]).flatMap((r) => {
          if (!r) return [];
          try {
            const rv = JSON.parse(r) as Review;
            return rv.status === "published" ? [{ id: rv.id, stars: rv.stars, comment: rv.comment, ts: rv.ts, reply: rv.reply }] : [];
          } catch {
            return [];
          }
        });
        return { ...toSummary(rating as Record<string, string> | null), reviews };
      }, empty);
    },
    ["tool-reviews", slug],
    { tags: [`reviews:${slug}`], revalidate: DAY }
  )();
}

// ─── Comments ───────────────────────────────────────────────────────────────

const DEFAULT_BLOCKLIST = [
  "casino", "viagra", "cialis", "porn", "escort", "loan", "backlink", "backlinks", "seo service", "airdrop",
  "crypto signal", "forex", "betting", "telegram me", "whatsapp me", "dm me", "follow me", "free followers",
];
const URL_RE = /(https?:\/\/|www\.|\[[^\]]*\]\([^)]*\)|<a\s)/i;
const DOMAIN_RE = /\b[a-z0-9-]{2,}\.(com|net|org|io|ru|xyz|info|biz|top|site|online|shop|app|dev|co|me|ly|gg)\b/i;

// RegExp constructor: the tsconfig target predates the "u" flag in literals, but runtimes all support it
const NON_WORD = new RegExp("[^\\p{L}\\p{N} ]", "gu");
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(NON_WORD, "").trim();

function redactSecrets(text: string): { text: string; redacted: boolean } {
  let out = text;
  for (const f of scanForSecrets(text)) if (f.match) out = out.split(f.match).join("[removed]");
  return { text: out, redacted: out !== text };
}

const ModerationSchema = z.object({
  category: z.enum(["genuine", "bug", "spam", "abusive"]),
  contains_secret: z.boolean(),
  cleaned: z.string(),
  note: z.string(),
});

const MODERATION_PROMPT = `You moderate short visitor comments left on a developer tool page of ToolNinja (free browser-based developer tools).

Classify the comment:
- "genuine": honest feedback or a review about the tool, positive or negative.
- "bug": reports something broken or wrong in the tool, or requests a specific fix/feature.
- "spam": advertising, links or promotion, SEO text, gibberish, or unrelated to the tool.
- "abusive": insults, harassment, hate, or sexual content.

"contains_secret": true if the comment includes anything that looks like a real credential, token, API key, password, private key or card number.
"cleaned": the comment unchanged, except any secret replaced with [removed].
"note": at most 12 words explaining your classification.`;

async function moderate(slug: string, comment: string): Promise<{ category: ReviewCategory; cleaned: string; note: string; secret: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) return { category: "unchecked", cleaned: comment, note: "AI moderation not configured", secret: false };
  try {
    const client = new Anthropic();
    const res = await client.messages.parse({
      model: "claude-haiku-5-5",
      max_tokens: 600,
      system: MODERATION_PROMPT,
      messages: [{ role: "user", content: `Tool: ${slug}\nComment:\n"""\n${comment}\n"""` }],
      output_config: { effort: "low", format: zodOutputFormat(ModerationSchema) },
    });
    const u = res.usage;
    await recordExtraCost(
      costMicro({ input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 })
    );
    if (res.stop_reason === "refusal") return { category: "abusive", cleaned: comment, note: "Model declined to process", secret: false };
    const p = res.parsed_output;
    if (!p) return { category: "unchecked", cleaned: comment, note: "Moderation result unreadable", secret: false };
    return { category: p.category, cleaned: p.cleaned.slice(0, MAX_COMMENT) || comment, note: p.note.slice(0, 120), secret: p.contains_secret };
  } catch {
    return { category: "unchecked", cleaned: comment, note: "AI moderation unavailable", secret: false };
  }
}

export type CommentOutcome = "accepted" | "paused" | "rate_limited" | "silently_blocked";

export async function submitComment(slug: string, stars: number, raw: string, visitor: string): Promise<CommentOutcome> {
  const settings = await getSettings();
  if (settings.commentsPaused) return "paused";

  // Rate limits: per visitor, and a site-wide spike that pauses comments automatically
  const [mine, , all] = (await kv()
    .batch()
    .incr(K.visitorComments(visitor))
    .expire(K.visitorComments(visitor), 3600)
    .incr(K.commentHour())
    .expire(K.commentHour(), 3600)
    .exec()
    .then((r) => [Number(r[0]), 0, Number(r[2])])) as number[];
  if (mine > COMMENTS_PER_VISITOR_HOUR) return "rate_limited";
  if (all > COMMENT_SPIKE_PER_HOUR) {
    await saveSettings({ commentsPaused: true });
    const fresh = await kv().set(K.alert, String(Date.now()), { ex: 7 * DAY, nx: true });
    if (fresh)
      await notify(`🚨 <b>Comment spike</b> — more than ${COMMENT_SPIKE_PER_HOUR} comments in an hour. New comments were paused automatically.`, [
        [
          { text: "Keep paused", data: "cm:pause" },
          { text: "Resume comments", data: "cm:resume" },
        ],
      ]);
    return "paused";
  }

  const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_COMMENT);

  // Content rules — spam gets the same "thanks" as everyone else
  if (text.length < 3 || /(.)\1{9,}/.test(text)) {
    await logSpam("junk", slug, text);
    return "silently_blocked";
  }
  if (URL_RE.test(text)) {
    await logSpam("link", slug, text);
    return "silently_blocked";
  }
  const blocked = [...DEFAULT_BLOCKLIST, ...settings.blocklist].find((w) => w && new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  if (blocked) {
    await logSpam("blocklist", slug, text);
    return "silently_blocked";
  }
  const norm = normalize(text);
  if (norm.length > 40) {
    const fresh = await kv().set(K.dup(createHash("sha256").update(norm).digest("hex").slice(0, 24)), "1", { ex: 30 * DAY, nx: true });
    if (!fresh) {
      await logSpam("duplicate", slug, text);
      return "silently_blocked";
    }
  }

  // Secrets never reach the AI or storage
  const local = redactSecrets(text);
  const ai = await moderate(slug, local.text);
  const mentionsDomain = DOMAIN_RE.test(local.text);

  let status: ReviewStatus;
  if (ai.category === "spam" || ai.category === "abusive") status = "rejected";
  else if (ai.category === "bug") status = "bug";
  else if (ai.category === "genuine" && settings.autoApprove && !mentionsDomain && !ai.secret && !local.redacted) status = "published";
  else status = "pending";

  const review: Review = {
    id: randomBytes(8).toString("hex"),
    slug,
    stars,
    comment: ai.cleaned,
    ts: Date.now(),
    status,
    category: ai.category,
    note: mentionsDomain ? `${ai.note} · mentions a domain`.trim() : ai.note,
    redacted: local.redacted || ai.secret,
    ...(status === "bug" ? { bugState: "new" as BugState } : {}),
  };
  const b = kv()
    .batch()
    .set(K.review(review.id), JSON.stringify(review), status === "rejected" ? { ex: 30 * DAY } : undefined)
    .zadd(K.status(status), review.ts, review.id);
  if (status === "published") b.zadd(K.toolPublished(slug), review.ts, review.id);
  await b.exec();
  if (status === "rejected") await logSpam(`ai_${ai.category}`, slug, review.comment);
  if (status === "published") revalidateTag(`reviews:${slug}`);
  if (status !== "rejected") await notifyReview(review);
  return status === "rejected" ? "silently_blocked" : "accepted";
}

async function notifyReview(r: Review) {
  const tool = tools.find((t) => t.slug === r.slug)?.name ?? r.slug;
  const head =
    r.status === "bug" ? `🐞 <b>Bug report</b> · ${esc(tool)}` : r.status === "published" ? `⭐ <b>New review (auto-approved)</b> · ${esc(tool)}` : `⭐ <b>New review</b> · ${esc(tool)}`;
  const body = [
    head,
    `${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}`,
    `“${esc(r.comment)}”`,
    r.redacted ? "⚠️ a secret was removed" : "",
    r.note ? `<i>AI: ${esc(r.note)}</i>` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const buttons =
    r.status === "pending"
      ? [[{ text: "✅ Approve", data: `rv:pub:${r.id}` }, { text: "❌ Reject", data: `rv:rej:${r.id}` }, { text: "🐞 Bug", data: `rv:bug:${r.id}` }]]
      : r.status === "bug"
        ? [[{ text: "✅ Publish as review", data: `rv:pub:${r.id}` }, { text: "❌ Reject", data: `rv:rej:${r.id}` }]]
        : [[{ text: "Unpublish", data: `rv:rej:${r.id}` }]];
  await notify(body, buttons);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function listReviews(status: ReviewStatus, limit = 100): Promise<Review[]> {
  const ids = await safe(() => kv().zrevrange(K.status(status), 0, limit - 1), []);
  if (!ids.length) return [];
  const b = kv().batch();
  ids.forEach((id) => b.get(K.review(id)));
  const rows = (await safe(() => b.exec(), [])) as (string | null)[];
  return rows.flatMap((r) => {
    if (!r) return [];
    try {
      return [JSON.parse(r) as Review];
    } catch {
      return [];
    }
  });
}

export async function countReviews(status: ReviewStatus): Promise<number> {
  return safe(() => kv().zcard(K.status(status)), 0);
}

export async function setReviewStatus(id: string, next: ReviewStatus | "deleted") {
  const raw = await kv().get(K.review(id));
  if (!raw) return;
  const rv = JSON.parse(raw) as Review;
  const b = kv().batch().zrem(K.status(rv.status), id).zrem(K.toolPublished(rv.slug), id);
  if (next === "deleted") b.del(K.review(id));
  else {
    rv.status = next;
    b.set(K.review(id), JSON.stringify(rv), next === "rejected" ? { ex: 30 * DAY } : undefined).zadd(K.status(next), rv.ts, id);
    if (next === "published") b.zadd(K.toolPublished(rv.slug), rv.ts, id);
  }
  await b.exec();
  revalidateTag(`reviews:${rv.slug}`);
}

async function updateReview(id: string, patch: (r: Review) => void) {
  const raw = await kv().get(K.review(id));
  if (!raw) return;
  const rv = JSON.parse(raw) as Review;
  patch(rv);
  await kv().set(K.review(id), JSON.stringify(rv), rv.status === "rejected" ? { ex: 30 * DAY } : undefined);
  revalidateTag(`reviews:${rv.slug}`);
}

/** Public reply under a review. Empty text removes it. */
export async function setReviewReply(id: string, text: string) {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_COMMENT);
  await updateReview(id, (r) => {
    if (clean) r.reply = { text: clean, ts: Date.now() };
    else delete r.reply;
  });
}

export async function setBugState(id: string, state: BugState, note?: string) {
  await updateReview(id, (r) => {
    r.bugState = state;
    if (note !== undefined) r.bugNote = note.trim().slice(0, 300);
  });
}

export async function getSpamLog(limit = 100): Promise<{ ts: number; layer: string; slug: string; excerpt: string }[]> {
  return (await safe(() => kv().lrange(K.spamLog, 0, limit - 1), [])).flatMap((r) => {
    try {
      return [JSON.parse(r)];
    } catch {
      return [];
    }
  });
}

export async function getSpamCounts(days = 7): Promise<Record<string, number>> {
  const b = kv().batch();
  const now = Date.now();
  for (let i = 0; i < days; i++) b.hgetall(K.spamDay(today(new Date(now - i * DAY * 1000))));
  const rows = (await safe(() => b.exec(), [])) as (Record<string, string> | null)[];
  const out: Record<string, number> = {};
  for (const r of rows) for (const [k, v] of Object.entries(r ?? {})) out[k] = (out[k] ?? 0) + Number(v);
  return out;
}

export async function getSpikeAlert(): Promise<number | null> {
  const v = await safe(() => kv().get(K.alert), null);
  return v ? Number(v) : null;
}

export async function clearSpikeAlert() {
  await kv().del(K.alert);
}
