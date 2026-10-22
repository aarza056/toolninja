import type { Metadata } from "next";
import Link from "next/link";
import { getDays, getTopics, getRecommendedTools, getUnmet, usd } from "@/lib/ninja-stats";
import { getSettings } from "@/lib/site-settings";
import { tools } from "@/lib/tools";
import { Badge, Button, Card, Stat, ago } from "@/components/admin/ui";
import DailyBars from "@/components/admin/DailyBars";
import { saveNinjaSettings, toggleNinja } from "../../actions";

export const metadata: Metadata = { title: "Ninja AI" };
export const dynamic = "force-dynamic";

const toolName = new Map(tools.map((t) => [t.slug, t.name]));

function BarList({ rows, total, link }: { rows: [string, number][]; total: number; link?: (k: string) => string }) {
  if (!rows.length) return <p className="text-sm text-[#666666]">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map(([k, v]) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between gap-3 mb-1">
            {link ? (
              <Link href={link(k)} className="truncate text-[#dddddd] hover:text-[#a855f7]">
                {toolName.get(k) ?? k}
              </Link>
            ) : (
              <span className="truncate text-[#dddddd]">{k}</span>
            )}
            <span className="shrink-0 text-[#888888] tabular-nums">
              {v} · {Math.round((v / total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full bg-[#a855f7] rounded-full" style={{ width: `${(v / rows[0][1]) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function NinjaAdmin() {
  const [days, topics, recTools, unmet, settings] = await Promise.all([getDays(30), getTopics(30), getRecommendedTools(30), getUnmet(100), getSettings()]);
  const t = days[0];
  const sum = (k: "requests" | "answered" | "noTool" | "costMicro" | "savedMicro" | "images" | "cacheRead" | "input") => days.reduce((s, d) => s + d[k], 0);
  const topicTotal = topics.reduce((s, [, v]) => s + v, 0);
  const toolTotal = recTools.reduce((s, [, v]) => s + v, 0);
  const chart = [...days].reverse().map((d) => ({ date: d.date, value: d.requests, detail: usd(d.costMicro) }));
  const failTotals: Record<string, number> = {};
  for (const d of days) for (const [k, v] of Object.entries(d.failures)) failTotals[k] = (failTotals[k] ?? 0) + v;
  const cacheShare = sum("cacheRead") / Math.max(1, sum("cacheRead") + sum("input"));

  return (
    <div className="space-y-6">
      <Card
        title="Controls"
        action={
          <form action={toggleNinja}>
            <input type="hidden" name="to" value={settings.aiEnabled ? "off" : "on"} />
            <Button tone={settings.aiEnabled ? "danger" : "good"}>{settings.aiEnabled ? "Switch Ninja AI off" : "Switch Ninja AI on"}</Button>
          </form>
        }
      >
        <form action={saveNinjaSettings} className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-[#dddddd]">
            <input type="checkbox" name="aiEnabled" defaultChecked={settings.aiEnabled} className="accent-[#a855f7] w-4 h-4" />
            Ninja AI enabled
          </label>
          <label className="text-sm text-[#dddddd]">
            <span className="block text-xs text-[#888888] mb-1">Daily question cap (whole site)</span>
            <input
              type="number"
              name="aiDailyCap"
              min={0}
              max={100000}
              defaultValue={settings.aiDailyCap}
              className="w-32 px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] tabular-nums"
            />
          </label>
          <Button tone="primary">Save</Button>
          <p className="text-xs text-[#777777] w-full">
            Changes apply immediately. Status: {settings.aiEnabled ? <Badge tone="good">on</Badge> : <Badge tone="bad">off</Badge>} · today {t.requests}/
            {settings.aiDailyCap}
          </p>
        </form>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Questions, 30 days" value={sum("requests")} sub={`${sum("images")} with images`} />
        <Stat label="Unanswered, 30 days" value={sum("noTool")} sub={`${Math.round((sum("noTool") / Math.max(1, sum("answered"))) * 100)}% of answers`} />
        <Stat label="AI cost, 30 days" value={usd(sum("costMicro"))} sub={`avg ${usd(sum("costMicro") / Math.max(1, sum("answered")))} / answer`} />
        <Stat label="Saved by caching" value={usd(sum("savedMicro"))} sub={`${Math.round(cacheShare * 100)}% of input from cache`} />
      </div>

      <Card title="Questions per day (last 30 days)">
        <DailyBars data={chart} label="Ninja questions per day, last 30 days" />
        <details className="mt-4">
          <summary className="text-xs text-[#888888] cursor-pointer hover:text-[#f5f5f5]">Show as table</summary>
          <table className="mt-3 w-full text-xs tabular-nums">
            <thead className="text-[#777777]">
              <tr>
                <th className="text-left font-normal py-1">Date</th>
                <th className="text-right font-normal">Questions</th>
                <th className="text-right font-normal">Answered</th>
                <th className="text-right font-normal">No tool</th>
                <th className="text-right font-normal">Cost</th>
              </tr>
            </thead>
            <tbody className="text-[#cccccc]">
              {days.map((d) => (
                <tr key={d.date} className="border-t border-[#1a1a1a]">
                  <td className="py-1">{d.date}</td>
                  <td className="text-right">{d.requests}</td>
                  <td className="text-right">{d.answered}</td>
                  <td className="text-right">{d.noTool}</td>
                  <td className="text-right">{usd(d.costMicro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Top topics (30 days)">
          <BarList rows={topics.slice(0, 12)} total={topicTotal} />
        </Card>
        <Card title="Most recommended tools (30 days)">
          <BarList rows={recTools.slice(0, 12)} total={toolTotal} link={(slug) => `/tools/${slug}`} />
        </Card>
      </div>

      <Card title={`Unanswered requests — tool ideas (${unmet.length})`}>
        <p className="text-xs text-[#777777] mb-3">
          Questions where no existing tool fit, summarised by the AI without the visitor&apos;s data. Use them to pick the next tools.
        </p>
        {unmet.length ? (
          <ul className="divide-y divide-[#1a1a1a]">
            {unmet.map((u, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-[#dddddd]">{u.text}</span>
                <span className="shrink-0 flex items-center gap-2 text-xs text-[#777777]">
                  {u.topic && <Badge>{u.topic}</Badge>} {ago(u.ts)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#666666]">Nothing yet — every question so far had a matching tool.</p>
        )}
      </Card>

      {Object.keys(failTotals).length > 0 && (
        <Card title="Not answered (30 days)">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(failTotals).map(([k, v]) => (
              <span key={k} className="px-2 py-1 bg-[#151515] border border-[#262626] rounded-md text-[#cccccc]">
                {k.replace(/_/g, " ")}: <span className="tabular-nums">{v}</span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
