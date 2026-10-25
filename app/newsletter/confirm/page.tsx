import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { confirm } from "@/lib/newsletter";
import { LATEST_TOOL_SLUGS, tools } from "@/lib/tools";

export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmPage({ searchParams }: { searchParams: { t?: string } }) {
  const result = await confirm(searchParams.t ?? "").catch(() => "invalid" as const);
  const latest = LATEST_TOOL_SLUGS.map((s) => tools.find((t) => t.slug === s)).filter(Boolean).slice(0, 3);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      {result === "invalid" ? (
        <>
          <AlertCircle size={40} className="mx-auto text-[#f87171]" />
          <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">This link has expired or was already used</h1>
          <p className="mt-2 text-sm text-[#999999]">Confirmation links work for 7 days. Sign up again from any page and we&apos;ll send a fresh one.</p>
        </>
      ) : (
        <>
          <CheckCircle2 size={40} className="mx-auto text-[#4ade80]" />
          <h1 className="mt-4 text-xl font-semibold text-[#f5f5f5]">{result === "already" ? "You're already subscribed" : "You're in! 🥷"}</h1>
          <p className="mt-2 text-sm text-[#999999]">You&apos;ll get an email when new tools ship — about once a month. Every email has a one-click unsubscribe.</p>
          {latest.length > 0 && (
            <div className="mt-8 text-left">
              <p className="text-xs uppercase tracking-wide text-[#777777] mb-2">Newest tools</p>
              <ul className="space-y-2">
                {latest.map((t) => (
                  <li key={t!.slug}>
                    <Link href={`/tools/${t!.slug}`} className="block p-3 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/50">
                      <span className="text-sm font-medium text-[#f5f5f5]">{t!.name}</span>
                      <span className="block text-xs text-[#888888] mt-0.5">{t!.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <Link href="/" className="inline-block mt-8 text-sm text-[#a855f7] hover:underline">
        ← All tools
      </Link>
    </div>
  );
}
