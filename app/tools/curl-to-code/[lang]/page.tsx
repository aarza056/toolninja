import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CurlToCodeClient from "../CurlToCodeClient";
import { CURL_LANGUAGE_PAGES } from "@/lib/curl-languages";

export const dynamicParams = false;
export const generateStaticParams = () => CURL_LANGUAGE_PAGES.map((p) => ({ lang: p.slug }));

const pageFor = (slug: string) => CURL_LANGUAGE_PAGES.find((p) => p.slug === slug);

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const p = pageFor(params.lang);
  if (!p) return {};
  const url = `https://toolninja.io/tools/curl-to-code/${p.slug}`;
  return {
    title: `cURL to ${p.name} Converter (${p.library})`,
    description: `Convert a curl command to ${p.name} code using ${p.library}: headers, body, method and Basic auth carried over, with correct string escaping. Free, runs in your browser.`,
    alternates: { canonical: url },
    openGraph: { url, title: `cURL to ${p.name} (${p.library})` },
  };
}

export default function CurlLanguagePage({ params }: { params: { lang: string } }) {
  const p = pageFor(params.lang);
  if (!p) notFound();
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Suspense fallback={null}>
        <CurlToCodeClient
          initialLanguage={p.lang}
          heading={`cURL to ${p.name}`}
          intro={`Paste a curl command and get ${p.name} code using ${p.library} — or pick any other language.`}
        />
      </Suspense>
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">
            How curl maps to {p.name} ({p.library})
          </h2>
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

        <nav>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Other languages</h2>
          <div className="flex flex-wrap gap-2">
            {CURL_LANGUAGE_PAGES.filter((x) => x.slug !== p.slug).map((x) => (
              <Link key={x.slug} href={`/tools/curl-to-code/${x.slug}`} className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#888] hover:text-[#a855f7]">
                cURL to {x.name}
              </Link>
            ))}
            <Link href="/blog/curl-to-python-javascript-code" className="px-3 py-1.5 text-xs text-[#a855f7] hover:underline">
              Guide: curl to Python and JavaScript →
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
