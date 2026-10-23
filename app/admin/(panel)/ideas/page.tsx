import type { Metadata } from "next";
import Link from "next/link";
import { listIdeas, IDEA_STATUSES, type IdeaStatus } from "@/lib/ideas";
import { Badge, Button, Card, ago } from "@/components/admin/ui";
import { ideaAction, mergeIdeasAction } from "../../actions";

export const metadata: Metadata = { title: "Ideas" };
export const dynamic = "force-dynamic";

const LABEL: Record<IdeaStatus, string> = { new: "New", planned: "Planned", built: "Built", dismissed: "Dismissed" };
const TONE = { new: "info", planned: "warn", built: "good", dismissed: "neutral" } as const;

export default async function IdeasAdmin({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = (IDEA_STATUSES.includes(searchParams.tab as IdeaStatus) ? searchParams.tab : "new") as IdeaStatus;
  const all = await listIdeas();
  const ideas = all.filter((i) => i.status === tab).sort((a, b) => b.count - a.count || b.lastTs - a.lastTs);
  const countOf = (s: IdeaStatus) => all.filter((i) => i.status === s).length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#888888] max-w-2xl">
        Tools visitors asked Ask Ninja for that ToolNinja doesn&apos;t have yet — summarised by the AI without their data, and counted every time someone asks
        again. Plan the most requested ones for the next round.
      </p>
      <div className="flex flex-wrap gap-2">
        {IDEA_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/ideas?tab=${s}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              tab === s ? "text-[#f5f5f5] border-[#a855f7]/60 bg-[#a855f7]/10" : "text-[#888888] border-[#262626] hover:text-[#f5f5f5]"
            }`}
          >
            {LABEL[s]} <span className="ml-1 text-[#777777] tabular-nums">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <Card title={`${LABEL[tab]} ideas`}>
        {!ideas.length ? (
          <p className="text-sm text-[#666666]">{tab === "new" ? "Nothing yet — every Ninja question so far had a matching tool." : "Nothing here."}</p>
        ) : (
          <ul className="divide-y divide-[#1a1a1a]">
            {ideas.map((i) => (
              <li key={i.id} className="py-3.5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[#f5f5f5]">{i.title}</span>
                      <Badge tone={TONE[i.status]}>
                        {i.count} request{i.count === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#777777]">
                      {i.topics.join(" · ")}
                      {i.topics.length ? " · " : ""}first {ago(i.firstTs)} · latest {ago(i.lastTs)}
                    </p>
                    {i.note && <p className="mt-1 text-xs text-[#c4a5f7]">Note: {i.note}</p>}
                  </div>
                  <form action={ideaAction} className="flex flex-wrap gap-1.5 shrink-0">
                    <input type="hidden" name="id" value={i.id} />
                    {IDEA_STATUSES.filter((s) => s !== i.status).map((s) => (
                      <Button key={s} name="status" value={s} tone={s === "built" ? "good" : s === "dismissed" ? "danger" : "neutral"}>
                        {s === "new" ? "Back to new" : LABEL[s]}
                      </Button>
                    ))}
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="text-[11px] text-[#666666] cursor-pointer hover:text-[#f5f5f5]">Rename · note · merge</summary>
                  <div className="mt-2 grid lg:grid-cols-2 gap-3">
                    <form action={ideaAction} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={i.id} />
                      <input name="title" defaultValue={i.title} maxLength={160} className="px-2.5 py-1.5 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-[#f5f5f5]" />
                      <input name="note" defaultValue={i.note ?? ""} maxLength={300} placeholder="Note (e.g. planned for round of Nov 2)" className="px-2.5 py-1.5 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-[#f5f5f5]" />
                      <div>
                        <Button>Save</Button>
                      </div>
                    </form>
                    {all.length > 1 && (
                      <form action={mergeIdeasAction} className="flex flex-col gap-2">
                        <input type="hidden" name="target" value={i.id} />
                        <span className="text-[11px] text-[#777777]">Merge these into this idea (their counts add up):</span>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {all
                            .filter((o) => o.id !== i.id)
                            .slice(0, 50)
                            .map((o) => (
                              <label key={o.id} className="flex items-center gap-2 text-xs text-[#bbbbbb]">
                                <input type="checkbox" name="merge" value={o.id} className="accent-[#a855f7]" /> {o.title} <span className="text-[#666666]">({o.count})</span>
                              </label>
                            ))}
                        </div>
                        <div>
                          <Button>Merge selected</Button>
                        </div>
                      </form>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
