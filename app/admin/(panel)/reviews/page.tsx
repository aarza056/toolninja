import type { Metadata } from "next";
import Link from "next/link";
import { countReviews, getSpamCounts, getSpamLog, listReviews, type Review, type ReviewStatus } from "@/lib/reviews";
import { tools } from "@/lib/tools";
import { Badge, Button, Card, Stars, ago } from "@/components/admin/ui";
import { approveAllGenuine, reviewAction } from "../../actions";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

const toolName = new Map(tools.map((t) => [t.slug, t.name]));
const TABS: { key: ReviewStatus | "spam"; label: string }[] = [
  { key: "pending", label: "To approve" },
  { key: "bug", label: "Bug reports" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "spam", label: "Spam log" },
];
const CATEGORY_TONE = { genuine: "good", bug: "info", spam: "bad", abusive: "bad", unchecked: "warn" } as const;
const LAYER_LABEL: Record<string, string> = {
  honeypot: "Hidden trap field",
  token: "No/invalid page token",
  too_fast: "Submitted too fast",
  junk: "Junk text",
  link: "Contained a link",
  blocklist: "Blocklisted word",
  duplicate: "Duplicate text",
  ai_spam: "AI: spam",
  ai_abusive: "AI: abusive",
};

function Row({ r }: { r: Review }) {
  const actions: { to: string; label: string; tone: "good" | "danger" | "neutral" }[] =
    r.status === "pending"
      ? [
          { to: "published", label: "Approve", tone: "good" },
          { to: "rejected", label: "Reject", tone: "danger" },
          { to: "bug", label: "Move to bugs", tone: "neutral" },
        ]
      : r.status === "bug"
        ? [
            { to: "published", label: "Publish", tone: "good" },
            { to: "deleted", label: "Resolved — delete", tone: "neutral" },
          ]
        : r.status === "published"
          ? [{ to: "rejected", label: "Unpublish", tone: "danger" }]
          : [
              { to: "published", label: "Publish anyway", tone: "neutral" },
              { to: "deleted", label: "Delete", tone: "danger" },
            ];
  return (
    <li className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
          <Stars value={r.stars} />
          <Link href={`/tools/${r.slug}`} className="text-[#c4a5f7] hover:underline">
            {toolName.get(r.slug) ?? r.slug}
          </Link>
          <Badge tone={CATEGORY_TONE[r.category]}>{r.category}</Badge>
          {r.redacted && <Badge tone="warn">secret removed</Badge>}
          <span className="text-[#666666]">{ago(r.ts)}</span>
        </div>
        <p className="text-sm text-[#e5e5e5] whitespace-pre-wrap break-words">{r.comment}</p>
        {r.note && <p className="mt-1 text-xs text-[#777777]">AI: {r.note}</p>}
      </div>
      <form action={reviewAction} className="flex flex-wrap gap-1.5 shrink-0">
        <input type="hidden" name="id" value={r.id} />
        {actions.map((a) => (
          <Button key={a.to} name="to" value={a.to} tone={a.tone}>
            {a.label}
          </Button>
        ))}
      </form>
    </li>
  );
}

export default async function ReviewsAdmin({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = (TABS.find((t) => t.key === searchParams.tab)?.key ?? "pending") as ReviewStatus | "spam";
  const counts = await Promise.all(["pending", "bug", "published", "rejected"].map((s) => countReviews(s as ReviewStatus)));
  const countOf: Record<string, number> = { pending: counts[0], bug: counts[1], published: counts[2], rejected: counts[3] };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              tab === t.key ? "text-[#f5f5f5] border-[#a855f7]/60 bg-[#a855f7]/10" : "text-[#888888] border-[#262626] hover:text-[#f5f5f5]"
            }`}
          >
            {t.label}
            {t.key !== "spam" && <span className="ml-1.5 text-[#777777] tabular-nums">{countOf[t.key]}</span>}
          </Link>
        ))}
      </div>
      {tab === "spam" ? <SpamLog /> : <ReviewList status={tab} />}
    </div>
  );
}

async function ReviewList({ status }: { status: ReviewStatus }) {
  const reviews = await listReviews(status, 200);
  const genuine = reviews.filter((r) => r.category === "genuine" && !r.redacted && !r.note.includes("mentions a domain")).length;
  return (
    <Card
      action={
        status === "pending" && genuine > 0 ? (
          <form action={approveAllGenuine}>
            <Button tone="good">Approve all {genuine} genuine</Button>
          </form>
        ) : undefined
      }
      title={
        status === "pending"
          ? "Waiting for approval — sorted by AI"
          : status === "bug"
            ? "Bug reports and feature requests"
            : status === "published"
              ? "Live on tool pages"
              : "Rejected (kept 30 days)"
      }
    >
      {reviews.length ? (
        <ul className="divide-y divide-[#1a1a1a]">
          {reviews.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#666666]">Nothing here.</p>
      )}
    </Card>
  );
}

async function SpamLog() {
  const [log, counts] = await Promise.all([getSpamLog(150), getSpamCounts(7)]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5">
      <Card title={`Blocked in the last 7 days: ${total}`}>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <span key={k} className="px-2 py-1 bg-[#151515] border border-[#262626] rounded-md text-[#cccccc]">
                {LAYER_LABEL[k] ?? k}: <span className="tabular-nums">{v}</span>
              </span>
            ))}
          {!total && <span className="text-[#666666]">Nothing blocked yet.</span>}
        </div>
      </Card>
      <Card title="Recent blocks">
        {log.length ? (
          <ul className="divide-y divide-[#1a1a1a] text-sm">
            {log.map((l, i) => (
              <li key={i} className="py-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Badge tone="bad">{LAYER_LABEL[l.layer] ?? l.layer}</Badge>
                <span className="text-xs text-[#888888]">{toolName.get(l.slug) ?? l.slug}</span>
                {l.excerpt && <span className="text-xs text-[#aaaaaa] truncate max-w-full">“{l.excerpt}”</span>}
                <span className="ml-auto text-xs text-[#666666]">{ago(l.ts)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#666666]">Nothing blocked yet.</p>
        )}
      </Card>
    </div>
  );
}
