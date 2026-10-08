import Link from "next/link";
import { toolContent } from "@/lib/tool-content";
import { tools } from "@/lib/tools";
import { getRelatedTools } from "@/lib/related-tools";
import { getPostsForTool } from "@/lib/blog-tool-map";
import { getPostBySlug } from "@/lib/blog";

interface Props {
  slug: string;
}

export default function ToolSeoSection({ slug }: Props) {
  const content = toolContent[slug];
  const tool = tools.find((t) => t.slug === slug);

  const relatedTools = tool ? getRelatedTools(slug) : [];
  const guides = getPostsForTool(slug)
    .map((postSlug) => getPostBySlug(postSlug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (!content && !relatedTools.length && !guides.length) return null;

  return (
    <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
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

      {/* Guides */}
      {guides.length > 0 && (
        <section data-tool-guides>
          <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
            Guides for this tool
          </h2>
          <ul className="space-y-2">
            {guides.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm text-[#aaaaaa] hover:text-[#c084fc] underline decoration-[#a855f7]/30 hover:decoration-[#a855f7] transition-colors"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section data-related-tools>
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
