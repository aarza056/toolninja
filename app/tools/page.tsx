import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/lib/tools";
import { CATEGORY_INFO, toolsInCategory } from "@/lib/categories";
import ToolGrid from "@/components/ToolGrid";

const BASE_URL = "https://toolninja.io";

export const metadata: Metadata = {
  title: `All ${tools.length} Free Developer Tools — Browser-Only`,
  description: `Every ToolNinja tool in one place: ${tools.length} free developer tools for formatting, encoding, generating, converting, testing, design and security. All run in your browser. No login.`,
  alternates: { canonical: `${BASE_URL}/tools` },
  openGraph: {
    title: `All ${tools.length} Free Developer Tools | ToolNinja`,
    description: `${tools.length} free, browser-only developer tools, grouped by category.`,
    url: `${BASE_URL}/tools`,
    images: [{ url: `/api/og?title=${encodeURIComponent("All Developer Tools")}&desc=${encodeURIComponent(`${tools.length} free, browser-only tools`)}`, width: 1200, height: 630 }],
  },
};

export default function ToolsIndexPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "All Developer Tools",
      url: `${BASE_URL}/tools`,
      description: `${tools.length} free, browser-only developer tools grouped by category.`,
      hasPart: CATEGORY_INFO.map((c) => ({ "@type": "CollectionPage", name: c.heading, url: `${BASE_URL}/tools/category/${c.slug}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ToolNinja", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/tools` },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#555555] mb-6">
        <Link href="/" className="hover:text-[#888888] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[#888888]">Tools</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-3">All {tools.length} developer tools</h1>
      <p className="text-[#888888] leading-relaxed max-w-3xl mb-8">
        Every tool runs entirely in your browser — nothing you paste is uploaded, and there&apos;s no account to create. Jump to a
        category, or browse the full list below.
      </p>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORY_INFO.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-full text-[#888888] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
          >
            {c.name} <span className="text-[#555555]">{toolsInCategory(c.name).length}</span>
          </a>
        ))}
      </div>

      <div className="space-y-12">
        {CATEGORY_INFO.map((c) => (
          <section key={c.slug} id={c.slug} className="scroll-mt-6">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-[#f5f5f5]">{c.heading}</h2>
              <Link href={`/tools/category/${c.slug}`} className="text-xs text-[#a855f7] hover:underline shrink-0">
                About {c.name.toLowerCase()} tools →
              </Link>
            </div>
            <ToolGrid tools={toolsInCategory(c.name)} />
          </section>
        ))}
      </div>
    </div>
  );
}
