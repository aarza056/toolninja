import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  vercelAnalyticsConfigured,
  VercelAnalyticsError,
  totals,
  series,
  top,
  today,
  yesterday,
  lastDays,
  monthToDate,
  countryName,
  pageLabel,
  referrerLabel,
  change,
  type Range,
  type TopRow,
} from "@/lib/vercel-analytics";
import { Card, Stat } from "@/components/admin/ui";
import DailyBars from "@/components/admin/DailyBars";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const RANGES = { "1": "Today", "7": "7 days", "30": "30 days" } as const;
const HOBBY_EVENTS = 50_000;
const n = (v: number) => v.toLocaleString("en-US");

function Delta({ now, before }: { now: number; before: number }) {
  const c = change(now, before);
  if (c === null) return null;
  return <span className={c >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>{c >= 0 ? "▲" : "▼"} {Math.abs(c)}%</span>;
}

function TopList({ rows, label, href }: { rows: TopRow[]; label: (v: string) => string; href?: (v: string) => string | null }) {
  if (!rows.length) return <p className="text-sm text-[#666666]">No data for this period yet.</p>;
  const max = Math.max(...rows.map((r) => r.visitors), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const link = href?.(r.value);
        return (
          <li key={r.value} className="text-sm">
            <div className="flex justify-between gap-3 mb-1">
              {link ? (
                <Link href={link} className="truncate text-[#dddddd] hover:text-[#a855f7]">
                  {label(r.value)}
                </Link>
              ) : (
                <span className="truncate text-[#dddddd]">{label(r.value)}</span>
              )}
              <span className="shrink-0 text-xs text-[#888888] tabular-nums">
                {n(r.visitors)} visitors · {n(r.pageviews)} views
              </span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#a855f7] rounded-full" style={{ width: `${(r.visitors / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Setup() {
  return (
    <Card title="Connect Vercel Web Analytics">
      <ol className="space-y-2 text-sm text-[#bbbbbb] list-decimal pl-5">
        <li>
          In Vercel, open <b>Account Settings → Tokens</b> and create a token (pick the scope that contains the ToolNinja project, and an expiry
          you&apos;re comfortable with).
        </li>
        <li>
          In <b>toolninja → Settings → Environment Variables</b>, add <code className="text-[#e9d5ff]">VERCEL_API_TOKEN</code> as a Sensitive variable
          (Production and Preview), then redeploy.
        </li>
        <li>
          Only if the project belongs to a team: also add <code className="text-[#e9d5ff]">VERCEL_TEAM_ID</code> (Team → Settings → General).
        </li>
      </ol>
      <p className="mt-3 text-xs text-[#777777]">The token stays on the server — it&apos;s never sent to browsers. Numbers come from the same Web Analytics data as the Vercel dashboard.</p>
    </Card>
  );
}

export default async function AnalyticsAdmin({ searchParams }: { searchParams: { range?: string } }) {
  if (!vercelAnalyticsConfigured()) return <Setup />;
  const rangeKey = (searchParams.range && searchParams.range in RANGES ? searchParams.range : "7") as keyof typeof RANGES;
  const topRange: Range = rangeKey === "1" ? today() : lastDays(Number(rangeKey));

  try {
    const now = Date.now();
    const prev7: Range = { since: lastDays(14, now).since, until: lastDays(7, now).since - 1 };
    const [tToday, tYesterday, t7, tPrev7, t30, tMonth, daily, hourly, pages, referrers, countries, devices, browsers] = await Promise.all([
      totals(today(now)),
      totals(yesterday(now)),
      totals(lastDays(7, now)),
      totals(prev7),
      totals(lastDays(30, now)),
      totals(monthToDate(now)),
      series(lastDays(30, now), "day"),
      series(today(now), "hour"),
      top("requestPath", topRange, 12),
      top("referrerHostname", topRange, 10),
      top("country", topRange, 10),
      top("deviceType", topRange, 5),
      top("browserName", topRange, 6),
    ]);
    const monthPct = Math.round((tMonth.pageviews / HOBBY_EVENTS) * 100);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Visitors today" value={n(tToday.visitors)} sub={<>{n(tToday.pageviews)} page views · yesterday {n(tYesterday.visitors)}</>} />
          <Stat label="Visitors, 7 days" value={n(t7.visitors)} sub={<>{n(t7.pageviews)} views · <Delta now={t7.visitors} before={tPrev7.visitors} /> vs previous 7</>} />
          <Stat label="Visitors, 30 days" value={n(t30.visitors)} sub={`${n(t30.pageviews)} page views`} />
          <Stat
            label="Page views this month"
            value={n(tMonth.pageviews)}
            sub={`${monthPct}% of the 50,000 Hobby events (if you're on Hobby)`}
          />
        </div>

        <Card title="Visitors per day (last 30 days)">
          <DailyBars
            data={daily.map((d) => ({ date: d.timestamp.slice(0, 10), value: d.visitors, detail: `${n(d.pageviews)} views` }))}
            label="Visitors per day, last 30 days"
          />
        </Card>

        <Card title="Today by hour (UTC)">
          <DailyBars
            data={hourly.map((h) => ({ date: `${h.timestamp.slice(0, 10)} ${h.timestamp.slice(11, 13)}:00`, value: h.visitors, detail: `${n(h.pageviews)} views` }))}
            label="Visitors per hour today"
          />
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#777777]">Breakdowns for:</span>
          {Object.entries(RANGES).map(([k, label]) => (
            <Link
              key={k}
              href={`/admin/analytics?range=${k}`}
              className={`px-3 py-1 text-xs rounded-full border ${rangeKey === k ? "text-[#f5f5f5] border-[#a855f7]/60 bg-[#a855f7]/10" : "text-[#888888] border-[#262626] hover:text-[#f5f5f5]"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Top pages">
            <TopList rows={pages} label={pageLabel} href={(p) => (p.startsWith("/") ? p : null)} />
          </Card>
          <Card title="Where visitors come from">
            <TopList rows={referrers} label={referrerLabel} />
          </Card>
          <Card title="Countries">
            <TopList rows={countries} label={countryName} />
          </Card>
          <div className="space-y-6">
            <Card title="Devices">
              <TopList rows={devices} label={(d) => d.charAt(0).toUpperCase() + d.slice(1)} />
            </Card>
            <Card title="Browsers">
              <TopList rows={browsers} label={(b) => b} />
            </Card>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-[#666666]">
          From Vercel Web Analytics (production only), refreshed every few minutes — your own visits are excluded by owner mode.
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#888888] hover:text-[#f5f5f5]">
            Vercel dashboard <ExternalLink size={11} />
          </a>
        </p>
      </div>
    );
  } catch (e) {
    const msg = e instanceof VercelAnalyticsError ? e.message : "Couldn't reach Vercel's API right now.";
    return (
      <Card title="Analytics unavailable">
        <p className="text-sm text-[#f87171]">{msg}</p>
        <p className="mt-2 text-xs text-[#777777]">Check Admin → Status for the connection details.</p>
      </Card>
    );
  }
}
