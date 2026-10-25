import type { Metadata } from "next";
import { listSubscribers, sendHistory, draftFromRelease, maskEmail, type SubStatus } from "@/lib/newsletter";
import { releases } from "@/lib/changelog";
import { emailConfigured, fromAddress } from "@/lib/email-send";
import { Alert, Badge, Button, Card, Stat, ago } from "@/components/admin/ui";
import { removeSubscriber } from "../../newsletter-actions";
import Composer from "./Composer";
import ExportButton from "./ExportButton";

export const metadata: Metadata = { title: "Newsletter" };
export const dynamic = "force-dynamic";

const TONE: Record<SubStatus, "good" | "warn" | "neutral" | "bad"> = { subscribed: "good", pending: "warn", unsubscribed: "neutral", bounced: "bad", complained: "bad" };

export default async function NewsletterAdmin({ searchParams }: { searchParams: { q?: string } }) {
  const [subs, history] = await Promise.all([listSubscribers(), sendHistory()]);
  const count = (s: SubStatus) => subs.filter((x) => x.status === s).length;
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const shown = (q ? subs.filter((s) => s.email.includes(q)) : subs).slice(0, 200);
  const releaseOptions = releases
    .filter((r) => r.items.some((i) => i.kind === "new" || i.kind === "improved" || i.kind === "guide"))
    .slice(0, 12)
    .map((r) => {
      const d = draftFromRelease(r);
      return { date: r.date, title: r.title, draft: { subject: d.subject, preheader: d.preheader, intro: d.intro } };
    });

  return (
    <div className="space-y-6">
      {!emailConfigured() && (
        <Alert tone="warn">Sending is off — add RESEND_API_KEY in Vercel (and .env.local for local tests). The signup box stays hidden until then.</Alert>
      )}
      {emailConfigured() && !process.env.RESEND_WEBHOOK_SECRET && (
        <Alert tone="info">Bounce and spam-complaint handling isn&apos;t connected yet — add a Resend webhook pointing to /api/newsletter/webhook and set RESEND_WEBHOOK_SECRET.</Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Subscribers" value={count("subscribed")} sub="confirmed, will receive the next email" />
        <Stat label="Waiting for confirmation" value={count("pending")} sub="clicked subscribe, not the email link yet" />
        <Stat label="Unsubscribed" value={count("unsubscribed")} />
        <Stat label="Bounced / spam" value={count("bounced") + count("complained")} sub="never emailed again" />
      </div>

      <Card title="Write a newsletter">
        <p className="text-xs text-[#777777] mb-4">
          Sender: <code className="text-[#e9d5ff]">{fromAddress()}</code> · replies go to info@toolninja.io
        </p>
        <Composer releases={releaseOptions} subscribers={count("subscribed")} defaultTestTo="info@toolninja.io" />
      </Card>

      <Card title="Sent">
        {history.length ? (
          <ul className="divide-y divide-[#1f1f1f]">
            {history.map((h) => (
              <li key={h.id + h.at} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="text-[#dddddd]">
                  {h.test && <Badge tone="info">test</Badge>} {h.subject}
                </span>
                <span className="text-xs text-[#888888]">
                  {h.sent}/{h.recipients} sent{h.failed ? ` · ${h.failed} failed` : ""} · {ago(h.at)}
                  {h.errors?.length ? <span className="block text-[#f87171]">{h.errors[0]}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#666666]">Nothing sent yet.</p>
        )}
      </Card>

      <Card title={`Subscribers (${subs.length})`} action={<ExportButton />}>
        <form className="mb-3">
          <input name="q" defaultValue={q} placeholder="Find an exact address…" className="w-full sm:w-80 px-3 py-1.5 text-sm bg-[#0a0a0a] border border-[#262626] rounded-lg text-[#f5f5f5]" />
        </form>
        {shown.length ? (
          <ul className="divide-y divide-[#1f1f1f]">
            {shown.map((s) => (
              <li key={s.email} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-mono text-[#dddddd]">{q ? s.email : maskEmail(s.email)}</span>
                <span className="flex items-center gap-2 text-xs text-[#888888]">
                  <Badge tone={TONE[s.status]}>{s.status}</Badge>
                  {ago(s.createdAt)} · {s.source || "—"}
                  <form action={removeSubscriber}>
                    <input type="hidden" name="email" value={s.email} />
                    <Button tone="danger">Delete</Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#666666]">{q ? "No subscriber with that address." : "No signups yet."}</p>
        )}
        <p className="mt-3 text-[11px] text-[#666666]">Addresses are masked; search for one to see it in full. Delete removes every trace — use it for “delete my data” requests.</p>
      </Card>
    </div>
  );
}
