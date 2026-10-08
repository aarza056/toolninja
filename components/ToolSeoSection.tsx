import Link from "next/link";
import { toolContent } from "@/lib/tool-content";
import { toolGuides } from "@/lib/tool-guides";
import { tools } from "@/lib/tools";
import { getRelatedTools } from "@/lib/related-tools";
import { getPostsForTool } from "@/lib/blog-tool-map";
import { getPostBySlug } from "@/lib/blog";

interface Props {
  slug: string;
}

const H2 = "text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3";

// Renders `code` spans in plain-text copy as <code>.
function withInlineCode(text: string) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="px-1 py-0.5 text-[0.85em] font-mono bg-[#1a1a1a] rounded text-[#cccccc]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

export default function ToolSeoSection({ slug }: Props) {
  const content = toolContent[slug];
  const guide = toolGuides[slug];
  const tool = tools.find((t) => t.slug === slug);

  const relatedTools = tool ? getRelatedTools(slug) : [];
  const guides = getPostsForTool(slug)
    .map((postSlug) => getPostBySlug(postSlug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (!content && !guide && !relatedTools.length && !guides.length) return null;

  return (
    <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
      {guide && (
        <>
          <section data-tool-intro>
            <p className="text-sm text-[#bbbbbb] leading-relaxed">{guide.intro}</p>
          </section>

          <section data-tool-howto>
            <h2 className={H2}>How to use</h2>
            <ol className="space-y-2 list-decimal pl-5 marker:text-[#a855f7]">
              {guide.howTo.map((step, i) => (
                <li key={i} className="text-sm text-[#999999] leading-relaxed pl-1">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section data-tool-examples>
            <h2 className={H2}>Examples</h2>
            <div className="space-y-5">
              {guide.examples.map((ex, i) => (
                <div key={i} className="border border-[#222222] rounded-[8px] p-4 bg-[#0d0d0d]">
                  <h3 className="text-sm font-medium text-[#dddddd] mb-3">{ex.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-[#888888] mb-1">Input</p>
                  <pre className="p-3 mb-3 font-mono text-xs bg-[#111111] border border-[#1f1f1f] rounded-[6px] text-[#e5e5e5] overflow-x-auto whitespace-pre-wrap break-all">
                    {ex.input}
                  </pre>
                  <p className="text-[11px] uppercase tracking-wider text-[#888888] mb-1">Output</p>
                  <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#1f1f1f] rounded-[6px] text-[#e5e5e5] overflow-x-auto whitespace-pre-wrap break-all">
                    {ex.output}
                  </pre>
                  {ex.note && <p className="mt-2 text-xs text-[#999999] leading-relaxed">{ex.note}</p>}
                </div>
              ))}
            </div>
          </section>

          <section data-tool-limitations>
            <h2 className={H2}>Limitations</h2>
            <ul className="space-y-2">
              {guide.limitations.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#999999]">
                  <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden="true">!</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {content && (
        <>
          {/* About */}
          <section>
            <h2 className={H2}>About this tool</h2>
            <div className="space-y-3">
              {content.about.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-[#999999] leading-relaxed">
                  {withInlineCode(para)}
                </p>
              ))}
            </div>
          </section>

          {/* Use cases */}
          <section>
            <h2 className="text-xs font-semibold text-[#999999] uppercase tracking-widest mb-3">
              When to use it
            </h2>
            <ul className="space-y-2">
              {content.useCases.map((uc, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#a3a3a3]">
                  <span className="text-[#a855f7] shrink-0 mt-0.5">→</span>
                  <span className="leading-relaxed">{uc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#999999] uppercase tracking-widest mb-3">
                Tips
              </h2>
              <ul className="space-y-2">
                {content.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-[#a3a3a3]">
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
              <h2 className="text-xs font-semibold text-[#999999] uppercase tracking-widest mb-4">
                Frequently asked questions
              </h2>
              <div className="space-y-5">
                {content.faq.map((item, i) => (
                  <div key={i} className="border-l-2 border-[#222] pl-4">
                    <h3 className="text-sm font-medium text-[#888] mb-1.5">
                      {item.q}
                    </h3>
                    <p className="text-sm text-[#999999] leading-relaxed">{item.a}</p>
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
          <h2 className="text-xs font-semibold text-[#999999] uppercase tracking-widest mb-3">
            Related tools
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedTools.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#a3a3a3] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
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
