import Link from "next/link";
import { toolContent } from "@/lib/tool-content";
import { tools } from "@/lib/tools";

interface Props {
  slug: string;
}

const BASE_URL = "https://toolninja.io";

export default function ToolSeoSection({ slug }: Props) {
  const content = toolContent[slug];
  const tool = tools.find((t) => t.slug === slug);

  const relatedTools = tool
    ? tools
        .filter((t) => t.slug !== slug && t.category === tool.category)
        .slice(0, 3)
    : [];

  const breadcrumbJsonLd = tool
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ToolNinja",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: tool.category,
            item: `${BASE_URL}/#${tool.category.toLowerCase()}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.name,
            item: `${BASE_URL}/tools/${slug}`,
          },
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

  if (!content && !relatedTools.length) return null;

  return (
    <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
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

      {/* Related tools */}
      {relatedTools.length > 0 && (
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
          </div>
        </section>
      )}
    </div>
  );
}
