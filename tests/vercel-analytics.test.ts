import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  VercelAnalyticsError,
  change,
  countryLabel,
  countryName,
  lastDays,
  pageLabel,
  previousDays,
  monthToDate,
  referrerLabel,
  series,
  today,
  top,
  totals,
  yesterday,
} from "@/lib/vercel-analytics";

const NOW = Date.UTC(2026, 9, 23, 14, 30); // 23 Oct 2026 14:30 UTC
const DAY = 86_400_000;
const MIDNIGHT = Date.UTC(2026, 9, 23);

// Answers are cached in storage (in memory here), so each test asks for a different range.
let seq = 0;
const fresh = (): number => NOW + ++seq * 1000;

function fakeVercel(body: unknown, status = 200) {
  const calls: URL[] = [];
  const fn = vi.fn(async (input: URL | string, init?: RequestInit) => {
    calls.push(new URL(String(input)));
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

beforeEach(() => {
  vi.stubEnv("VERCEL_API_TOKEN", "test-token");
  vi.stubEnv("VERCEL_ANALYTICS_PROJECT", "toolninja");
  vi.stubEnv("VERCEL_TEAM_ID", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// Ranges are whole UTC days ending at the next midnight (exclusive): Vercel rounds since/until to
// days, and a range that starts and ends on the same day comes back empty.
describe("Vercel analytics ranges (UTC)", () => {
  it("today is the whole UTC day", () => expect(today(NOW)).toEqual({ since: MIDNIGHT, until: MIDNIGHT + DAY }));
  it("yesterday is the whole previous day", () => expect(yesterday(NOW)).toEqual({ since: MIDNIGHT - DAY, until: MIDNIGHT }));
  it("last 7 days includes today", () => expect(lastDays(7, NOW)).toEqual({ since: MIDNIGHT - 6 * DAY, until: MIDNIGHT + DAY }));
  it("previous 7 days ends where the last 7 start", () => expect(previousDays(7, NOW)).toEqual({ since: MIDNIGHT - 13 * DAY, until: MIDNIGHT - 6 * DAY }));
  it("month to date starts on the 1st and includes today", () => expect(monthToDate(NOW)).toEqual({ since: Date.UTC(2026, 9, 1), until: MIDNIGHT + DAY }));
  it("no range starts and ends on the same day", () => {
    for (const r of [today(NOW), yesterday(NOW), lastDays(7, NOW), lastDays(30, NOW), previousDays(7, NOW), monthToDate(NOW)]) {
      expect(r.until % DAY).toBe(0);
      expect(r.until - r.since).toBeGreaterThanOrEqual(DAY);
    }
  });
});

describe("Vercel analytics requests", () => {
  it("totals calls visits/count with project, range and token", async () => {
    const { calls } = fakeVercel({ data: { pageviews: 120, visitors: 45 } });
    const range = { since: MIDNIGHT, until: fresh() };
    expect(await totals(range)).toEqual({ pageviews: 120, visitors: 45 });
    expect(calls[0].pathname).toBe("/v1/query/web-analytics/visits/count");
    expect(calls[0].searchParams.get("projectId")).toBe("toolninja");
    expect(calls[0].searchParams.get("since")).toBe(String(range.since));
    expect(calls[0].searchParams.get("until")).toBe(String(range.until));
    expect(calls[0].searchParams.has("teamId")).toBe(false);
  });

  it("sends teamId when set", async () => {
    vi.stubEnv("VERCEL_TEAM_ID", "team_abc");
    const { calls } = fakeVercel({ data: { pageviews: 1, visitors: 1 } });
    await totals({ since: MIDNIGHT, until: fresh() });
    expect(calls[0].searchParams.get("teamId")).toBe("team_abc");
  });

  it("caches answers so the API isn't called twice", async () => {
    const { fn } = fakeVercel({ data: { pageviews: 7, visitors: 3 } });
    const range = { since: MIDNIGHT, until: fresh() };
    await totals(range);
    expect(await totals(range)).toEqual({ pageviews: 7, visitors: 3 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("a single day's totals come from the daily breakdown (same numbers as the chart)", async () => {
    const day = Date.UTC(2026, 6, 1 + (++seq % 28)); // a fresh past day, so nothing is cached
    const { calls } = fakeVercel({
      data: [
        { timestamp: new Date(day - DAY).toISOString(), pageviews: 1, visitors: 1 },
        { timestamp: new Date(day).toISOString(), pageviews: 81, visitors: 55 },
      ],
    });
    expect(await totals({ since: day, until: day + DAY })).toEqual({ pageviews: 81, visitors: 55 });
    expect(calls[0].pathname).toBe("/v1/query/web-analytics/visits/aggregate");
    expect(calls[0].searchParams.get("by")).toBe("day");
  });

  it("series drops buckets outside the range and from the future", async () => {
    const since = Date.UTC(2026, 5, 1 + (++seq % 28));
    const at = (h: number) => ({ timestamp: new Date(since + h * 3_600_000).toISOString(), pageviews: 2, visitors: 1 });
    fakeVercel({ data: [{ ...at(-1) }, at(0), at(5), at(6), at(24)] });
    const pts = await series({ since, until: since + DAY }, "hour", since + 5.5 * 3_600_000);
    expect(pts.map((p) => p.timestamp)).toEqual([at(0).timestamp, at(5).timestamp]);
  });

  it("series asks for buckets by day", async () => {
    const { calls } = fakeVercel({ data: [{ timestamp: "2026-10-22T00:00:00.000Z", pageviews: 10, visitors: 4 }] });
    const pts = await series({ since: MIDNIGHT - 29 * DAY, until: fresh() }, "day");
    expect(calls[0].pathname).toBe("/v1/query/web-analytics/visits/aggregate");
    expect(calls[0].searchParams.get("by")).toBe("day");
    expect(pts).toEqual([{ timestamp: "2026-10-22T00:00:00.000Z", pageviews: 10, visitors: 4 }]);
  });

  it("top rows are sorted by visitors and blanks become (none)", async () => {
    const { calls } = fakeVercel({
      data: [
        { referrerHostname: "news.ycombinator.com", pageviews: 5, visitors: 2 },
        { referrerHostname: "", pageviews: 50, visitors: 30 },
        { referrerHostname: "www.google.com", pageviews: 20, visitors: 9 },
      ],
    });
    const rows = await top("referrerHostname", { since: MIDNIGHT, until: fresh() }, 5);
    expect(calls[0].searchParams.get("by")).toBe("referrerHostname");
    expect(calls[0].searchParams.get("limit")).toBe("5");
    expect(rows.map((r) => r.value)).toEqual(["(none)", "www.google.com", "news.ycombinator.com"]);
    expect(rows.map((r) => referrerLabel(r.value))).toEqual(["Direct / unknown", "google.com", "news.ycombinator.com"]);
  });

  it.each([
    [401, /token/],
    [402, /plan/],
    [403, /VERCEL_TEAM_ID/],
    [404, /VERCEL_ANALYTICS_PROJECT/],
    [429, /rate limit/],
    [500, /500/],
  ])("HTTP %i becomes a readable error", async (status, message) => {
    fakeVercel({ error: { code: "x" } }, status);
    const err = await totals({ since: MIDNIGHT, until: fresh() }).catch((e) => e);
    expect(err).toBeInstanceOf(VercelAnalyticsError);
    expect(err.status).toBe(status);
    expect(err.message).toMatch(message);
  });

  it("errors are not cached", async () => {
    const range = { since: MIDNIGHT, until: fresh() };
    fakeVercel({}, 500);
    await expect(totals(range)).rejects.toThrow();
    fakeVercel({ data: { pageviews: 2, visitors: 1 } });
    expect(await totals(range)).toEqual({ pageviews: 2, visitors: 1 });
  });

  it("refuses to call Vercel without a token", async () => {
    vi.stubEnv("VERCEL_API_TOKEN", "");
    const { fn } = fakeVercel({});
    await expect(totals({ since: MIDNIGHT, until: fresh() })).rejects.toThrow(/VERCEL_API_TOKEN/);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("Vercel analytics labels", () => {
  it("country codes get a flag and a name", () => {
    expect(countryLabel("AM")).toBe("🇦🇲 Armenia");
    expect(countryLabel("us")).toBe("🇺🇸 United States");
    expect(countryLabel("(none)")).toBe("(none)");
    expect(countryName("de")).toBe("Germany");
  });
  it("page paths become tool names", () => {
    expect(pageLabel("/")).toBe("Home");
    expect(pageLabel("/tools/jwt-decoder")).toBe("JWT Decoder");
    expect(pageLabel("/tools/jwt-decoder/")).toBe("JWT Decoder");
    expect(pageLabel("/changelog")).toBe("/changelog");
  });
  it("percentage change", () => {
    expect(change(150, 100)).toBe(50);
    expect(change(50, 100)).toBe(-50);
    expect(change(10, 0)).toBeNull();
  });
});
