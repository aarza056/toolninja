import type { Metadata } from "next";
import Link from "next/link";
import { MailX, CheckCircle2, AlertCircle } from "lucide-react";
import { subscriberForToken, maskEmail } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Showing this page changes nothing — the button does. Mail scanners open every link in an email,
// and a GET that unsubscribed would remove people who never clicked.
export default async function UnsubscribePage({ searchParams }: { searchParams: { t?: string; done?: string } }) {
  const t = searchParams.t ?? "";
  const sub = t === "TEST" ? null : await subscriberForToken(t).catch(() => null);

  let body: React.ReactNode;
  if (t === "TEST") {
    body = (
      <>
        <MailX size={40} className="mx-auto text-[#a855f7]" />
        <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">This is the unsubscribe page</h1>
        <p className="mt-2 text-sm text-[#999999]">You opened it from a test email, so there&apos;s nothing to unsubscribe. Real emails link to each subscriber&apos;s own page.</p>
      </>
    );
  } else if (!sub) {
    body = (
      <>
        <AlertCircle size={40} className="mx-auto text-[#f87171]" />
        <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">We couldn&apos;t find this subscription</h1>
        <p className="mt-2 text-sm text-[#999999]">
          The link may be incomplete. Reply to any of our emails or write to <a href="mailto:info@toolninja.io" className="text-[#a855f7] hover:underline">info@toolninja.io</a> and we&apos;ll remove you.
        </p>
      </>
    );
  } else if (searchParams.done === "1" || sub.status === "unsubscribed") {
    body = (
      <>
        <CheckCircle2 size={40} className="mx-auto text-[#4ade80]" />
        <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">You&apos;re unsubscribed</h1>
        <p className="mt-2 text-sm text-[#999999]">{maskEmail(sub.email)} won&apos;t get any more emails from us. The tools stay free — come back anytime.</p>
      </>
    );
  } else {
    body = (
      <>
        <MailX size={40} className="mx-auto text-[#a855f7]" />
        <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">Unsubscribe {maskEmail(sub.email)}?</h1>
        <p className="mt-2 text-sm text-[#999999]">You&apos;ll stop getting emails about new tools. One click and you&apos;re done.</p>
        <form method="post" action="/api/newsletter/unsubscribe" className="mt-6">
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="from" value="page" />
          <button type="submit" className="px-5 py-2.5 text-sm font-medium rounded-[8px] bg-[#a855f7] hover:bg-[#9333ea] text-white">
            Unsubscribe
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      {body}
      <Link href="/" className="inline-block mt-8 text-sm text-[#a855f7] hover:underline">
        ← All tools
      </Link>
    </div>
  );
}
