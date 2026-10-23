import type { Metadata } from "next";
import Link from "next/link";
import { getDays, getTopics, getRecommendedTools, usd, monthKey } from "@/lib/ninja-stats";
import { listIdeas } from "@/lib/ideas";
import { kv, safe } from "@/lib/kv";
import NinjaTestConsole from "@/components/admin/NinjaTestConsole";
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
  const [days, topics, recTools, ideas, settings, monthRaw] = await Promise.all([
    getDays(30),
    getTopics(30),
    getRecommendedTools(30),
    listIdeas(),
    getSettings(),
    safe(() => kv().get(monthKey()), null),
  ]);
  const monthMicro = Number(monthRaw ?? 0);
  const budget = settings.aiMonthlyBudgetMicro;
  const budgetPct = budget ? Math.min(100, Math.round((monthMicro / budget) * 100)) : 0;
  const topIdeas = ideas.filter((i) => i.status === "new").sort((a, b) => b.count - a.count).slice(0, 5);
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
          <label className="text-sm text-[#dddddd]">
            <span className="block text-xs text-[#888888] mb-1">Monthly AI budget, $ (0 = no limit)</span>
            <input
              type="number"
              name="budget"
              min={0}
              max={1000}
              step="0.5"
              defaultValue={(budget / 1e6).toFixed(2)}
              className="w-32 px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] tabular-nums"
            />
          </label>
          <Button tone="primary">Save</Button>
          <p className="text-xs text-[#777777] w-full">
            Changes apply immediately. Status: {settings.aiEnabled ? <Badge tone="good">on</Badge> : <Badge tone="bad">off</Badge>} · today {t.requests}/
            {settings.aiDailyCap}
          </p>
        </form>
        {budget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#888888] mb-1 tabular-nums">
              <span>
                This month {usd(monthMicro)} of {usd(budget)}
              </span>
              <span>{budgetPct}%{budgetPct >= 100 ? " — paused until the 1st" : ""}</span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden" role="progressbar" aria-valuenow={budgetPct} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly AI budget used">
              <div className={`h-full rounded-full ${budgetPct >= 100 ? "bg-[#ef4444]" : budgetPct >= 80 ? "bg-[#f59e0b]" : "bg-[#a855f7]"}`} style={{ width: `${budgetPct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-[#666666]">At 80% you get a Telegram warning; at 100% Ninja pauses itself and resumes automatically on the 1st.</p>
          </div>
        )}
      </Card>

      <Card title="Test console">
        <NinjaTestConsole />
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

      <Card title="Most requested missing tools" action={<Link href="/admin/ideas" className="text-xs text-[#c4a5f7] hover:underline">Open idea board →</Link>}>
        {topIdeas.length ? (
          <ul className="divide-y divide-[#1a1a1a]">
            {topIdeas.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-[#dddddd]">{u.title}</span>
                <span className="shrink-0 flex items-center gap-2 text-xs text-[#777777]">
                  <Badge tone="info">{u.count}×</Badge> {ago(u.lastTs)}
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
