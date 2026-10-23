import { kv, safe, today, DAY } from "@/lib/kv";
import { upsertIdea } from "@/lib/ideas";

// Anonymous Ask Ninja statistics: counts, token usage, cost, topics and unmet requests.
// The visitor's question text is never stored — only the model's short topic label and,
// when no tool fits, its one-line redacted description of what was wanted.

const KEEP_DAYS = 90;
const dayKey = (d: string) => `tn:ai:day:${d}`;
const topicKey = (d: string) => `tn:ai:topics:${d}`;
const toolKey = (d: string) => `tn:ai:tools:${d}`;
const UNMET = "tn:ai:unmet";
export const monthKey = (ym = today().slice(0, 7)) => `tn:ai:month:${ym}`;

// Claude Haiku 5.5, USD per million tokens. A 1-hour cache write costs 2x input, a cache read 0.1x.
const PRICE = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.2 };

/** Cost in micro-dollars (1e-6 USD) — tokens x price-per-million works out exactly to that unit. */
export function costMicro(u: { input: number; output: number; cacheRead: number; cacheWrite: number }): number {
  return Math.round(u.input * PRICE.input + u.output * PRICE.output + u.cacheRead * PRICE.cacheRead + u.cacheWrite * PRICE.cacheWrite);
}

export interface AskRecord {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  image: boolean;
  topic: string;
  tools: string[];
  unmet: string;
}

export async function recordAsk(r: AskRecord) {
  const d = today();
  const b = kv().batch();
  const cost = costMicro(r);
  b.hincrby(dayKey(d), "answered", 1)
    .hincrby(dayKey(d), "input", r.input)
    .hincrby(dayKey(d), "output", r.output)
    .hincrby(dayKey(d), "cacheRead", r.cacheRead)
    .hincrby(dayKey(d), "cacheWrite", r.cacheWrite)
    .hincrby(dayKey(d), "costMicro", cost)
    .incrby(monthKey(), cost)
    .expire(monthKey(), 400 * DAY)
    // what the cached part would have cost at the normal input price
    .hincrby(dayKey(d), "savedMicro", Math.round(r.cacheRead * (PRICE.input - PRICE.cacheRead)))
    .expire(dayKey(d), KEEP_DAYS * DAY);
  if (r.image) b.hincrby(dayKey(d), "images", 1);
  const topic = r.topic.trim().toLowerCase().slice(0, 40);
  if (topic) b.hincrby(topicKey(d), topic, 1).expire(topicKey(d), KEEP_DAYS * DAY);
  for (const t of r.tools) b.hincrby(toolKey(d), t, 1);
  if (r.tools.length) b.expire(toolKey(d), KEEP_DAYS * DAY);
  else b.hincrby(dayKey(d), "noTool", 1);
  const unmet = r.unmet.trim().slice(0, 160);
  if (unmet) b.lpush(UNMET, JSON.stringify({ ts: Date.now(), topic, text: unmet })).ltrim(UNMET, 0, 499);
  await safe(() => b.exec(), []);
  if (unmet) await safe(() => upsertIdea(unmet, topic), undefined);
}

export async function recordFailure(reason: string) {
  const d = today();
  await safe(() => kv().batch().hincrby(dayKey(d), `fail_${reason}`, 1).expire(dayKey(d), KEEP_DAYS * DAY).exec(), []);
}

/** Extra AI spend outside Ask Ninja (review moderation), so the cost total is complete. */
export async function recordExtraCost(micro: number, field = "moderationMicro") {
  const d = today();
  await safe(
    () =>
      kv()
        .batch()
        .hincrby(dayKey(d), field, micro)
        .hincrby(dayKey(d), "costMicro", micro)
        .expire(dayKey(d), KEEP_DAYS * DAY)
        .incrby(monthKey(), micro)
        .expire(monthKey(), 400 * DAY)
        .exec(),
    []
  );
}

export interface DayStats {
  date: string;
  requests: number;
  answered: number;
  noTool: number;
  images: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  costMicro: number;
  savedMicro: number;
  moderationMicro: number;
  failures: Record<string, number>;
}

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) out.push(today(new Date(now - i * DAY * 1000)));
  return out;
}

export async function getDays(n: number): Promise<DayStats[]> {
  const days = lastDays(n);
  const b = kv().batch();
  days.forEach((d) => b.hgetall(dayKey(d)));
  const rows = (await safe(() => b.exec(), [])) as (Record<string, string> | null)[];
  return days.map((date, i) => {
    const r = rows[i] ?? {};
    const num = (k: string) => Number(r[k] ?? 0);
    const failures: Record<string, number> = {};
    for (const [k, v] of Object.entries(r)) if (k.startsWith("fail_")) failures[k.slice(5)] = Number(v);
    return {
      date,
      requests: num("requests"),
      answered: num("answered"),
      noTool: num("noTool"),
      images: num("images"),
      input: num("input"),
      output: num("output"),
      cacheRead: num("cacheRead"),
      cacheWrite: num("cacheWrite"),
      costMicro: num("costMicro"),
      savedMicro: num("savedMicro"),
      moderationMicro: num("moderationMicro"),
      failures,
    };
  });
}

async function sumHashes(prefix: (d: string) => string, n: number): Promise<[string, number][]> {
  const days = lastDays(n);
  const b = kv().batch();
  days.forEach((d) => b.hgetall(prefix(d)));
  const rows = (await safe(() => b.exec(), [])) as (Record<string, string> | null)[];
  const total = new Map<string, number>();
  for (const r of rows) for (const [k, v] of Object.entries(r ?? {})) total.set(k, (total.get(k) ?? 0) + Number(v));
  return Array.from(total.entries()).sort((a, b) => b[1] - a[1]);
}

export const getTopics = (n: number) => sumHashes(topicKey, n);
export const getRecommendedTools = (n: number) => sumHashes(toolKey, n);

export async function getUnmet(limit = 100): Promise<{ ts: number; topic: string; text: string }[]> {
  const rows = await safe(() => kv().lrange(UNMET, 0, limit - 1), []);
  return rows.flatMap((r) => {
    try {
      return [JSON.parse(r)];
    } catch {
      return [];
    }
  });
}

export const usd = (micro: number) => (micro / 1e6).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: micro < 1e6 ? 4 : 2 });

/** Per-request counters checked before calling the model. One round trip. */
export async function countRequest(visitor: string): Promise<{ window: number; daily: number; total: number; monthMicro: number }> {
  const d = today();
  const bucket = Math.floor(Date.now() / 600000);
  const res = await kv()
    .batch()
    .incr(`tn:rl:ai:${visitor}:${bucket}`)
    .expire(`tn:rl:ai:${visitor}:${bucket}`, 600)
    .incr(`tn:rl:ai:${visitor}:${d}`)
    .expire(`tn:rl:ai:${visitor}:${d}`, DAY)
    .hincrby(dayKey(d), "requests", 1)
    .expire(dayKey(d), KEEP_DAYS * DAY)
    .get(monthKey())
    .exec();
  return { window: Number(res[0]), daily: Number(res[2]), total: Number(res[4]), monthMicro: Number(res[6] ?? 0) };
}
