import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AiTokenCounterClient from "../AiTokenCounterClient";
import { LLM_MODELS, PRICES_CHECKED, PRICING_SOURCES } from "@/lib/llm-pricing";
import { TOKEN_COUNTER_PAGES as PAGES } from "@/lib/token-counter-pages";

// One page per provider: the counter with that provider's models first, plus how to get an exact
// count from that provider (content in lib/token-counter-pages.ts).

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PAGES).map((provider) => ({ provider }));

export function generateMetadata({ params }: { params: { provider: string } }): Metadata {
  const p = PAGES[params.provider];
  if (!p) return {};
  const url = `https://toolninja.io/tools/ai-token-counter/${params.provider}`;
  return {
    title: `${p.name} Token Counter & Cost Calculator`,
    description: `Count tokens for ${p.name} prompts and see what they cost on every current ${p.provider} model, with the latest list prices. Free, runs in your browser.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${p.name} Token Counter` },
  };
}

export default function ProviderTokenCounterPage({ params }: { params: { provider: string } }) {
  const p = PAGES[params.provider];
  if (!p) notFound();
  const models = LLM_MODELS.filter((m) => m.provider === p.provider);
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <AiTokenCounterClient
        provider={p.provider}
        heading={`${p.name} Token Counter`}
        intro={`Paste a prompt to estimate its ${p.name} tokens and what it costs on each ${p.provider} model.`}
      />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">{p.provider} prices per 1M tokens</h2>
          <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#111111]">
                <tr>
                  {["Model", "Input", "Cached input", "Output"].map((c) => (
                    <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e]">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="even:bg-[#0d0d0d]">
                    <td className="px-3 py-1.5 border-b border-[#161616] text-[#dddddd]">{m.label}</td>
                    <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#bbbbbb]">${m.rates.input}</td>
                    <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#bbbbbb]">${m.rates.cacheRead}</td>
                    <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#bbbbbb]">${m.rates.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#555] leading-relaxed mt-2">
            Standard rates from{" "}
            <a href={PRICING_SOURCES[p.provider]} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">
              {p.provider}&apos;s pricing page
            </a>
            , checked {PRICES_CHECKED}. Batch requests cost half.{" "}
            <Link href="/tools/llm-api-cost-calculator" className="text-[#a855f7] hover:underline">
              Estimate a monthly bill →
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Counting {p.name} tokens</h2>
          <p className="text-sm text-[#bbbbbb] leading-relaxed mb-3">{p.exact}</p>
          <ul className="space-y-2">
            {p.notes.map((n) => (
              <li key={n} className="flex gap-2.5 text-sm text-[#888]">
                <span className="text-[#a855f7] shrink-0 mt-0.5">→</span>
                <span className="leading-relaxed">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Frequently asked</h2>
          <div className="space-y-4">
            {p.faq.map((x) => (
              <div key={x.q} className="border-l-2 border-[#a855f7]/40 pl-4">
                <h3 className="text-sm font-medium text-[#dddddd]">{x.q}</h3>
                <p className="text-sm text-[#999999] mt-1 leading-relaxed">{x.a}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 text-sm">
          {Object.entries(PAGES)
            .filter(([slug]) => slug !== params.provider)
            .map(([slug, x]) => (
              <Link key={slug} href={`/tools/ai-token-counter/${slug}`} className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#888] hover:text-[#a855f7]">
                {x.name} token counter
              </Link>
            ))}
          <Link href="/tools/ai-token-counter" className="px-3 py-1.5 text-xs text-[#a855f7] hover:underline">
            All models →
          </Link>
        </nav>
      </div>
    </>
  );
}
