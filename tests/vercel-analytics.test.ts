import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  VercelAnalyticsError,
  change,
  countryLabel,
  countryName,
  lastDays,
  pageLabel,
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

describe("Vercel analytics ranges (UTC)", () => {
  it("today starts at UTC midnight", () => expect(today(NOW)).toEqual({ since: MIDNIGHT, until: NOW }));
  it("yesterday is the whole previous day", () => expect(yesterday(NOW)).toEqual({ since: MIDNIGHT - DAY, until: MIDNIGHT - 1 }));
  it("last 7 days includes today", () => expect(lastDays(7, NOW)).toEqual({ since: MIDNIGHT - 6 * DAY, until: NOW }));
  it("month to date starts on the 1st", () => expect(monthToDate(NOW).since).toBe(Date.UTC(2026, 9, 1)));
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
