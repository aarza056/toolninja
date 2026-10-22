import type { Metadata } from "next";
import Link from "next/link";
import { getAllRatings, getHeldRatings, MIN_RATINGS_FOR_STARS } from "@/lib/reviews";
import { tools } from "@/lib/tools";
import { Badge, Button, Card, Stat, Stars, ago } from "@/components/admin/ui";
import { heldAction } from "../../actions";

export const metadata: Metadata = { title: "Ratings" };
export const dynamic = "force-dynamic";

const SORTS = { count: "Most rated", avg: "Highest", low: "Lowest", name: "A–Z" } as const;

export default async function RatingsAdmin({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = (searchParams.sort && searchParams.sort in SORTS ? searchParams.sort : "count") as keyof typeof SORTS;
  const [ratings, held] = await Promise.all([getAllRatings(), getHeldRatings()]);
  const rows = tools.map((t) => ({ slug: t.slug, name: t.name, ...ratings.get(t.slug)! }));
  const rated = rows.filter((r) => r.count > 0);
  const ready = rated.filter((r) => r.count >= MIN_RATINGS_FOR_STARS);
  const total = rated.reduce((s, r) => s + r.count, 0);
  const overall = total ? rated.reduce((s, r) => s + r.avg * r.count, 0) / total : 0;
  const lowest = ready.filter((r) => r.avg < 3.5).sort((a, b) => a.avg - b.avg).slice(0, 5);

  const sorted = [...rows].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : sort === "avg" ? b.avg - a.avg || b.count - a.count : sort === "low" ? (a.count && b.count ? a.avg - b.avg : b.count - a.count) : b.count - a.count
  );

  const heldBySlug = new Map<string, typeof held>();
  for (const h of held) heldBySlug.set(h.slug, [...(heldBySlug.get(h.slug) ?? []), h]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Ratings" value={total} sub={`${rated.length} of ${tools.length} tools rated`} />
        <Stat label="Average" value={overall ? overall.toFixed(2) : "—"} sub={overall ? <Stars value={overall} /> : "no ratings yet"} />
        <Stat label="Stars in Google" value={ready.length} sub={`tools with ${MIN_RATINGS_FOR_STARS}+ ratings`} />
        <Stat label="Held bursts" value={held.length} sub={heldBySlug.size ? `on ${heldBySlug.size} tools` : "none"} />
      </div>

      {heldBySlug.size > 0 && (
        <Card title="Held rating bursts">
          <p className="text-xs text-[#777777] mb-3">A tool received unusually many ratings within an hour. Accept them if the traffic is real (e.g. a post went viral), reject if it looks like vote flooding.</p>
          <ul className="divide-y divide-[#1a1a1a]">
            {Array.from(heldBySlug.entries()).map(([slug, hs]) => {
              const avg = hs.reduce((s, h) => s + h.stars, 0) / hs.length;
              return (
                <li key={slug} className="py-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-[#f5f5f5]">{tools.find((t) => t.slug === slug)?.name ?? slug}</span>
                  <span className="text-xs text-[#888888]">
                    {hs.length} ratings · avg {avg.toFixed(1)} · latest {ago(Math.max(...hs.map((h) => h.ts)))}
                  </span>
                  <form action={heldAction} className="ml-auto flex gap-1.5">
                    <input type="hidden" name="slug" value={slug} />
                    <Button name="to" value="accept" tone="good">
                      Accept all
                    </Button>
                    <Button name="to" value="reject" tone="danger">
                      Reject all
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {lowest.length > 0 && (
        <Card title="Needs attention — lowest rated">
          <ul className="space-y-1.5 text-sm">
            {lowest.map((r) => (
              <li key={r.slug} className="flex items-center gap-3">
                <Stars value={r.avg} />
                <Link href={`/tools/${r.slug}`} className="text-[#dddddd] hover:text-[#a855f7]">
                  {r.name}
                </Link>
                <span className="text-xs text-[#777777]">
                  {r.avg.toFixed(2)} from {r.count}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="All tools"
        action={
          <div className="flex gap-1">
            {Object.entries(SORTS).map(([k, label]) => (
              <Link
                key={k}
                href={`/admin/ratings?sort=${k}`}
                className={`px-2 py-1 text-[11px] rounded-md ${sort === k ? "bg-[#a855f7]/15 text-[#e9d5ff]" : "text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#777777]">
              <tr>
                <th className="text-left font-normal pb-2">Tool</th>
                <th className="text-left font-normal pb-2">Rating</th>
                <th className="text-right font-normal pb-2">Count</th>
                <th className="text-left font-normal pb-2 pl-4 hidden sm:table-cell">1★ → 5★</th>
                <th className="text-right font-normal pb-2">Google</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.slug} className="border-t border-[#1a1a1a]">
                  <td className="py-1.5 pr-3">
                    <Link href={`/tools/${r.slug}`} className="text-[#dddddd] hover:text-[#a855f7]">
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-1.5 whitespace-nowrap">{r.count ? <><Stars value={r.avg} /> <span className="text-xs text-[#888888] tabular-nums">{r.avg.toFixed(2)}</span></> : <span className="text-[#555555]">—</span>}</td>
                  <td className="py-1.5 text-right tabular-nums text-[#cccccc]">{r.count}</td>
                  <td className="py-1.5 pl-4 text-xs text-[#888888] tabular-nums hidden sm:table-cell">{r.count ? r.dist.join(" · ") : ""}</td>
                  <td className="py-1.5 text-right">
                    {r.count >= MIN_RATINGS_FOR_STARS ? <Badge tone="good">stars</Badge> : <span className="text-xs text-[#555555]">{r.count}/{MIN_RATINGS_FOR_STARS}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
