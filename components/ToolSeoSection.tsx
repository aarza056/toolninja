import Link from "next/link";
import { toolContent } from "@/lib/tool-content";
import { tools } from "@/lib/tools";
import AdSlot from "@/components/AdSlot";
import { AD_SLOTS } from "@/lib/ads";
import { getAllPosts } from "@/lib/blog";
import { categorySlug } from "@/lib/categories";
import { toolReferences } from "@/lib/tool-references";
import SupportCard from "@/components/support/SupportCard";
import ToolReviews from "@/components/reviews/ToolReviews";
import { getToolReviewData } from "@/lib/reviews";
import { getSiteConfig } from "@/lib/site-config";
import { emailConfigured } from "@/lib/email-send";
import NewsletterSignup from "@/components/NewsletterSignup";
import { GuideVideo, ShortVideo } from "@/components/videos/PageVideos";
import { videosForPage } from "@/lib/videos";
import { getVideos } from "@/lib/video-store";

interface Props {
  slug: string;
}

const BASE_URL = "https://toolninja.io";

export default async function ToolSeoSection({ slug }: Props) {
  const { flags } = await getSiteConfig();
  const content = toolContent[slug];
  const tool = tools.find((t) => t.slug === slug);

  const relatedTools = tool
    ? tools
        .filter((t) => t.slug !== slug && t.category === tool.category)
        .slice(0, 6)
    : [];

  const guides = getAllPosts()
    .filter((p) => p.relatedTools.includes(slug))
    .slice(0, 4);

  const catSlug = tool ? categorySlug(tool.category) : "";
  const reference = toolReferences[slug];

  const breadcrumbJsonLd = tool
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ToolNinja", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/tools` },
          { "@type": "ListItem", position: 3, name: tool.category, item: `${BASE_URL}/tools/category/${catSlug}` },
          { "@type": "ListItem", position: 4, name: tool.name, item: `${BASE_URL}/tools/${slug}` },
        ],
      }
    : null;

  const faqJsonLd =
    content?.faq
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  const pageVideos = videosForPage(await getVideos(), `/tools/${slug}`);
  const short = pageVideos.find((v) => v.format === "short");
  const guide = pageVideos.find((v) => v.format === "guide");

  return (
    <div className="border-t border-[#1a1a1a] px-6 py-10">
      <div className={short ? "flex flex-col gap-10 xl:flex-row xl:items-start" : undefined}>
        {/* A Short sits beside the text on wide screens and right under the tool on narrow ones */}
        {short && (
          <aside className="w-full max-w-[280px] mx-auto shrink-0 xl:order-last xl:mx-0 xl:w-[260px] xl:sticky xl:top-6">
            <ShortVideo video={short} />
          </aside>
        )}
        <div className="space-y-8 max-w-3xl min-w-0 xl:flex-1">
          {breadcrumbJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
          )}
          {faqJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
          )}

          {guide && <GuideVideo video={guide} />}

          {tool && flags.ratings && <ToolReviews slug={slug} toolName={tool.name} initial={await getToolReviewData(slug)} />}

          {flags.newsletter && emailConfigured() && <NewsletterSignup source={`tool/${slug}`} compact />}

          <AdSlot slot={AD_SLOTS.toolPage} />

          {content && (
            <>
              {/* About */}
              <section>
                <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
                  About this tool
                </h2>
                <p className="text-sm text-[#666] leading-relaxed">{content.about}</p>
              </section>

              {/* Use cases */}
              <section>
                <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
                  When to use it
                </h2>
                <ul className="space-y-2">
                  {content.useCases.map((uc, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-[#666]">
                      <span className="text-[#a855f7] shrink-0 mt-0.5">→</span>
                      <span className="leading-relaxed">{uc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Tips */}
              {content.tips && content.tips.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
                    Tips
                  </h2>
                  <ul className="space-y-2">
                    {content.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-[#666]">
                        <span className="text-[#06b6d4] shrink-0 mt-0.5">◆</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* FAQ */}
              {content.faq && content.faq.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">
                    Frequently asked questions
                  </h2>
                  <div className="space-y-5">
                    {content.faq.map((item, i) => (
                      <div key={i} className="border-l-2 border-[#222] pl-4">
                        <h3 className="text-sm font-medium text-[#888] mb-1.5">
                          {item.q}
                        </h3>
                        <p className="text-sm text-[#555] leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Reference table */}
          {reference && (
            <section>
              <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">{reference.title}</h2>
              {reference.intro && <p className="text-sm text-[#666] leading-relaxed mb-3">{reference.intro}</p>}
              <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#111111]">
                    <tr>
                      {reference.columns.map((c) => (
                        <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e]">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reference.rows.map((row, i) => (
                      <tr key={i} className="even:bg-[#0d0d0d]">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-3 py-1.5 border-b border-[#161616] text-[13px] ${j === 0 ? "font-mono text-[#c9a3f5]" : "text-[#888]"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reference.note && <p className="text-xs text-[#555] leading-relaxed mt-2">{reference.note}</p>}
            </section>
          )}

          {/* Guides */}
          {guides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
                Guides
              </h2>
              <ul className="space-y-2">
                {guides.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/blog/${g.slug}`} className="group flex gap-2.5 text-sm text-[#888] hover:text-[#a855f7] transition-colors">
                      <span className="shrink-0">{g.coverEmoji}</span>
                      <span className="leading-relaxed">{g.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related tools */}
          {relatedTools.length > 0 && tool && (
            <section>
              <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
                Related tools
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#666] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
                  >
                    {t.name}
                  </Link>
                ))}
                <Link
                  href={`/tools/category/${catSlug}`}
                  className="px-3 py-1.5 text-xs text-[#a855f7] hover:underline"
                >
                  All {tool.category.toLowerCase()} tools →
                </Link>
              </div>
            </section>
          )}

          {flags.support && <SupportCard placement="tool-page" />}
        </div>
      </div>
    </div>
  );
}
