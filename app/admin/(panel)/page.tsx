import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { getDays, usd, monthKey } from "@/lib/ninja-stats";
import { kv, safe } from "@/lib/kv";
import { listIdeas } from "@/lib/ideas";
import { twoFactorEnabled } from "@/lib/two-factor";
import { tgConfigured, getChatId } from "@/lib/telegram";
import Link from "next/link";
import { getSettings } from "@/lib/site-settings";
import { countReviews, getHeldRatings, getSpikeAlert, getAllRatings } from "@/lib/reviews";
import { Alert, Button, Card, Stat } from "@/components/admin/ui";
import { dismissSpikeAlert } from "../actions";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";


const LINKS = [
  { label: "Vercel Analytics", href: "https://vercel.com/dashboard" },
  { label: "Google Analytics", href: "https://analytics.google.com/" },
  { label: "Search Console", href: "https://search.google.com/search-console" },
  { label: "Anthropic usage", href: "https://console.anthropic.com/settings/usage" },
  { label: "Upstash", href: "https://console.upstash.com/" },
  { label: "Patreon", href: "https://www.patreon.com/cw/ToolNinjaio" },
];

export default async function AdminOverview() {
  const [days, settings, pending, bugs, held, spike, ratings, monthRaw, ideas, tfa, chat] = await Promise.all([
    getDays(1),
    getSettings(),
    countReviews("pending"),
    countReviews("bug"),
    getHeldRatings(),
    getSpikeAlert(),
    getAllRatings(),
    safe(() => kv().get(monthKey()), null),
    listIdeas(),
    twoFactorEnabled(),
    getChatId(),
  ]);
  const t = days[0];
  const monthCost = Number(monthRaw ?? 0);
  const budget = settings.aiMonthlyBudgetMicro;
  const newIdeas = ideas.filter((i) => i.status === "new").length;
  const capPct = settings.aiDailyCap ? Math.round((t.requests / settings.aiDailyCap) * 100) : 0;
  const totalRatings = Array.from(ratings.values()).reduce((s, r) => s + r.count, 0);
  const heldTools = new Set(held.map((h) => h.slug)).size;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {!settings.aiEnabled && <Alert tone="bad">Ninja AI is switched off.</Alert>}
        {settings.aiEnabled && capPct >= 80 && (
          <Alert tone="warn">
            Ninja AI is at {capPct}% of today&apos;s cap ({t.requests}/{settings.aiDailyCap}).
          </Alert>
        )}
        {spike && (
          <Alert tone="bad">
            Comment spike detected {new Date(spike).toLocaleString()} — new comments were paused automatically.
            <form action={dismissSpikeAlert}>
              <Button>Dismiss</Button>
            </form>
          </Alert>
        )}
        {settings.commentsPaused && !spike && <Alert tone="warn">New comments are paused (Settings).</Alert>}
        {pending > 0 && <Alert tone="info">{pending} review{pending === 1 ? "" : "s"} waiting for approval.</Alert>}
        {heldTools > 0 && (
          <Alert tone="warn">
            Rating bursts held on {heldTools} tool{heldTools === 1 ? "" : "s"} ({held.length} ratings) — check Ratings.
          </Alert>
        )}
        {budget > 0 && monthCost >= budget && <Alert tone="bad">Ninja AI used this month&apos;s budget ({usd(monthCost)}) and is paused until the 1st.</Alert>}
        {budget > 0 && monthCost >= budget * 0.8 && monthCost < budget && (
          <Alert tone="warn">
            AI spend this month is {usd(monthCost)} of the {usd(budget)} budget.
          </Alert>
        )}
        {!tfa && (
          <Alert tone="warn">
            Two-step sign-in is off.{" "}
            <Link href="/admin/settings" className="underline">
              Turn it on
            </Link>
          </Alert>
        )}
        {tgConfigured() && !chat && (
          <Alert tone="info">
            Telegram bot is set up but not connected.{" "}
            <Link href="/admin/settings" className="underline">
              Connect it
            </Link>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Ninja questions today" value={t.requests} sub={`cap ${settings.aiDailyCap} · ${capPct}%`} href="/admin/ninja" />
        <Stat label="AI cost today" value={usd(t.costMicro)} sub={`saved ${usd(t.savedMicro)} by caching`} href="/admin/ninja" />
        <Stat
          label="AI cost this month"
          value={usd(monthCost)}
          sub={budget ? `of ${usd(budget)} budget · ${Math.round((monthCost / budget) * 100)}%` : "no budget set"}
          href="/admin/ninja"
        />
        <Stat label="New tool ideas" value={newIdeas} sub="requests no tool solved" href="/admin/ideas" />
        <Stat label="Reviews to approve" value={pending} href="/admin/reviews" />
        <Stat label="Bug reports" value={bugs} href="/admin/reviews?tab=bug" />
        <Stat label="Ratings, all tools" value={totalRatings} href="/admin/ratings" />
        <Stat label="Held rating bursts" value={held.length} href="/admin/ratings" />
      </div>

      <Card title="Other dashboards">
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#bbbbbb] bg-[#151515] border border-[#262626] rounded-lg hover:text-[#f5f5f5] hover:border-[#3a3a3a]"
            >
              {l.label} <ExternalLink size={11} />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
