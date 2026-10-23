import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_INFO, getCategoryBySlug, toolsInCategory } from "@/lib/categories";
import { getAllPosts } from "@/lib/blog";
import ToolGrid from "@/components/ToolGrid";

const BASE_URL = "https://toolninja.io";

interface Props {
  params: { category: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_INFO.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return {};
  const url = `${BASE_URL}/tools/category/${cat.slug}`;
  const og = `/api/og?title=${encodeURIComponent(cat.heading)}&desc=${encodeURIComponent(cat.description)}`;
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: { title: `${cat.title} | ToolNinja`, description: cat.description, url, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: cat.title, description: cat.description, images: [og] },
  };
}

export default function CategoryPage({ params }: Props) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const categoryTools = toolsInCategory(cat.name);
  const slugs = new Set(categoryTools.map((t) => t.slug));
  const guides = getAllPosts()
    .filter((p) => p.relatedTools.some((s) => slugs.has(s)))
    .slice(0, 6);
  const url = `${BASE_URL}/tools/category/${cat.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cat.heading,
      description: cat.description,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: categoryTools.length,
        itemListElement: categoryTools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${BASE_URL}/tools/${t.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ToolNinja", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/tools` },
        { "@type": "ListItem", position: 3, name: cat.name, item: url },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#555555] mb-6">
        <Link href="/" className="hover:text-[#888888] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-[#888888] transition-colors">Tools</Link>
        <span>/</span>
        <span className="text-[#888888]">{cat.name}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-4">{cat.heading}</h1>
      <div className="max-w-3xl space-y-3 mb-8">
        {cat.intro.map((p, i) => (
          <p key={i} className="text-[#888888] leading-relaxed">{p}</p>
        ))}
      </div>

      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">
        {categoryTools.length} {cat.name.toLowerCase()} tools
      </h2>
      <ToolGrid tools={categoryTools} />

      {guides.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/blog/${g.slug}`}
                className="group p-4 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/40 transition-colors"
              >
                <p className="text-sm font-medium text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors mb-1">
                  {g.coverEmoji} {g.title}
                </p>
                <p className="text-xs text-[#666666] line-clamp-2">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 pt-6 border-t border-[#1a1a1a]">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_INFO.filter((c) => c.slug !== cat.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/tools/category/${c.slug}`}
              className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-full text-[#888888] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
            >
              {c.heading}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
