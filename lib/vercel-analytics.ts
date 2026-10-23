import { kv } from "@/lib/kv";
import { tools } from "@/lib/tools";

// Read-only client for Vercel's Web Analytics API (page views and visitors, as shown in the Vercel
// dashboard). Used by /admin → Visitors and the Telegram /visitors commands.
//
// Config: VERCEL_API_TOKEN (required, server-only), VERCEL_ANALYTICS_PROJECT (project id or name,
// default "toolninja"), VERCEL_TEAM_ID (only if the project belongs to a team).
// Answers are cached in storage for a few minutes, so admin and Telegram share them and the API
// isn't called on every page load. The data is aggregated by Vercel — near real time, not live.

const API_BASE = process.env.VERCEL_API_BASE || "https://api.vercel.com"; // overridable for tests
const CACHE_SECONDS = 5 * 60;

export const vercelAnalyticsConfigured = () => Boolean(process.env.VERCEL_API_TOKEN);

export class VercelAnalyticsError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function explain(status: number): string {
  if (status === 401) return "Vercel rejected the token — create a new one and update VERCEL_API_TOKEN.";
  if (status === 402) return "Your Vercel plan doesn't include the Web Analytics API.";
  if (status === 403) return "The token can't access this project — if the project belongs to a team, set VERCEL_TEAM_ID.";
  if (status === 404) return "Project not found — check VERCEL_ANALYTICS_PROJECT (and VERCEL_TEAM_ID for team projects).";
  if (status === 429) return "Vercel's rate limit was hit — try again in a minute.";
  return `Vercel's API returned ${status}.`;
}

type Params = Record<string, string | number | string[] | undefined>;

async function request<T>(path: string, params: Params): Promise<T> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new VercelAnalyticsError("VERCEL_API_TOKEN is not set.", 0);
  const url = new URL(`/v1/query/web-analytics/${path}`, API_BASE);
  url.searchParams.set("projectId", process.env.VERCEL_ANALYTICS_PROJECT || "toolninja");
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    for (const one of Array.isArray(v) ? v : [v]) url.searchParams.append(k, String(one));
  }

  const cacheKey = `tn:va:${path}:${url.searchParams.toString()}`;
  try {
    const hit = await kv().get(cacheKey);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // cache unavailable — just ask Vercel
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new VercelAnalyticsError(explain(res.status), res.status);
  const body = (await res.json()) as T;
  try {
    await kv().set(cacheKey, JSON.stringify(body), { ex: CACHE_SECONDS });
  } catch {}
  return body;
}

// ─── Time ranges (UTC days, matching the rest of /admin) ─────────────────────
// Vercel rounds since/until to whole days when a query has no hour/day breakdown, and a range
// that starts and ends on the same day comes back empty (that showed "0 visitors today" while the
// daily chart had numbers). So every range is whole UTC days: `until` is the next midnight,
// exclusive.

const DAY_MS = 86_400_000;
export function startOfUtcDay(t = Date.now()): number {
  return Math.floor(t / DAY_MS) * DAY_MS;
}

export interface Range {
  since: number;
  /** exclusive — always a UTC midnight */
  until: number;
}

/** Last `days` UTC days including today, e.g. 7 → today and the 6 days before. */
export function lastDays(days: number, now = Date.now()): Range {
  const tomorrow = startOfUtcDay(now) + DAY_MS;
  return { since: tomorrow - days * DAY_MS, until: tomorrow };
}

export const today = (now = Date.now()): Range => lastDays(1, now);
export const yesterday = (now = Date.now()): Range => ({ since: startOfUtcDay(now) - DAY_MS, until: startOfUtcDay(now) });
/** The `days` days just before lastDays(days), for "vs previous" comparisons. */
export const previousDays = (days: number, now = Date.now()): Range => {
  const r = lastDays(days, now);
  return { since: r.since - days * DAY_MS, until: r.since };
};
export const monthToDate = (now = Date.now()): Range => {
  const d = new Date(now);
  return { since: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), until: startOfUtcDay(now) + DAY_MS };
};

// ─── Queries ────────────────────────────────────────────────────────────────

export interface Totals {
  pageviews: number;
  visitors: number;
}

export async function totals(range: Range): Promise<Totals> {
  // One day: read it from the daily breakdown, the same numbers the daily chart shows
  if (range.until - range.since === DAY_MS) {
    const day = (await series(range, "day")).find((p) => Date.parse(p.timestamp) === range.since);
    return { pageviews: day?.pageviews ?? 0, visitors: day?.visitors ?? 0 };
  }
  const r = await request<{ data: Partial<Totals> }>("visits/count", { since: range.since, until: range.until });
  return { pageviews: Number(r.data?.pageviews ?? 0), visitors: Number(r.data?.visitors ?? 0) };
}

export interface TimePoint extends Totals {
  timestamp: string;
}

export async function series(range: Range, granularity: "hour" | "day", now = Date.now()): Promise<TimePoint[]> {
  const r = await request<{ data: Partial<TimePoint>[] }>("visits/aggregate", { since: range.since, until: range.until, by: granularity, limit: 100 });
  return (r.data ?? [])
    .map((p) => ({ timestamp: String(p.timestamp), pageviews: Number(p.pageviews ?? 0), visitors: Number(p.visitors ?? 0) }))
    .filter((p) => {
      // keep buckets inside the range, and none from the future (e.g. later hours of today)
      const t = Date.parse(p.timestamp);
      return t >= range.since && t < range.until && t <= now;
    });
}

export type Dimension = "requestPath" | "referrerHostname" | "country" | "deviceType" | "browserName" | "osName" | "utmSource";

export interface TopRow extends Totals {
  value: string;
}

export async function top(dimension: Dimension, range: Range, limit = 10): Promise<TopRow[]> {
  const r = await request<{ data: Record<string, unknown>[] }>("visits/aggregate", { since: range.since, until: range.until, by: dimension, limit });
  return (r.data ?? [])
    .map((row) => ({
      value: String(row[dimension] ?? row.groupId ?? "").trim() || "(none)",
      pageviews: Number(row.pageviews ?? 0),
      visitors: Number(row.visitors ?? 0),
    }))
    .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews);
}

// ─── Presentation helpers (shared by admin and Telegram) ────────────────────

export function countryName(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Name with a flag emoji — for Telegram; Windows browsers can't draw flags, so admin uses countryName. */
export function countryLabel(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  const flag = String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  return `${flag} ${countryName(code)}`;
}

const toolNames = new Map(tools.map((t) => [`/tools/${t.slug}`, t.name]));

/** "/tools/jwt-decoder" → "JWT Decoder", "/" → "Home", anything else as is. */
export function pageLabel(path: string): string {
  return path === "/" ? "Home" : toolNames.get(path.replace(/\/$/, "")) ?? path;
}

export function referrerLabel(host: string): string {
  return host === "(none)" || !host ? "Direct / unknown" : host.replace(/^www\./, "");
}

/** Percentage change, or null when there's nothing to compare against. */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
