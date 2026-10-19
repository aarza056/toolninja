import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/lib/tools";
import { CATEGORY_INFO } from "@/lib/categories";
import ToolGrid from "@/components/ToolGrid";

// Overrides the root layout's index/follow (and its googlebot directive) so they don't contradict
// the noindex Next.js adds to not-found responses.
export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

const POPULAR = ["totp-generator", "json-formatter", "regex-tester", "xpath-tester", "cidr-calculator", "ssh-key-generator"];

export default function NotFound() {
  const popular = POPULAR.map((s) => tools.find((t) => t.slug === s)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <p className="text-sm text-[#a855f7] font-mono mb-2">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-3">This page doesn&apos;t exist</h1>
      <p className="text-[#888888] mb-8">
        The link may be mistyped or outdated. Try the <Link href="/tools" className="text-[#a855f7] hover:underline">full list of tools</Link>,
        or press <kbd className="px-1.5 py-0.5 text-xs bg-[#1a1a1a] border border-[#333] rounded">Ctrl K</kbd> to search.
      </p>

      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Popular tools</h2>
      <ToolGrid tools={popular} />

      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mt-10 mb-3">Browse by category</h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_INFO.map((c) => (
          <Link
            key={c.slug}
            href={`/tools/category/${c.slug}`}
            className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-full text-[#888888] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
          >
            {c.heading}
          </Link>
        ))}
      </div>
    </div>
  );
}
