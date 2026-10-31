import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RegexTesterClient from "../RegexTesterClient";
import { FLAVORS } from "@/lib/regex-flavors";
import { FLAVOR_PAGES } from "@/lib/regex-flavor-pages";

export const dynamicParams = false;
export const generateStaticParams = () => FLAVORS.map((f) => ({ flavor: f.slug }));

const flavorFor = (slug: string) => FLAVORS.find((f) => f.slug === slug);

export function generateMetadata({ params }: { params: { flavor: string } }): Metadata {
  const f = flavorFor(params.flavor);
  if (!f) return {};
  const url = `https://toolninja.io/tools/regex-tester/${f.slug}`;
  return {
    title: `${f.name} Regex Tester Online`,
    description: `Test ${f.name} regular expressions online with live highlighting, see what behaves differently in ${f.engine}, and copy ready-to-use ${f.name} code. Free, in your browser.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${f.name} Regex Tester` },
  };
}

export default function FlavorRegexPage({ params }: { params: { flavor: string } }) {
  const f = flavorFor(params.flavor);
  if (!f) notFound();
  const page = FLAVOR_PAGES[f.id];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <RegexTesterClient
        flavor={f.id}
        heading={`${f.name} Regex Tester`}
        intro={`Test regular expressions written for ${f.name} (${f.engine}) — with warnings for anything that works differently there, and ${f.name} code to copy.`}
      />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">{f.name} regex syntax at a glance</h2>
          <dl className="divide-y divide-[#1a1a1a] border border-[#222222] rounded-[8px]">
            {page.syntax.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-sm">
                <dt className="w-28 shrink-0 text-[#888888]">{k}</dt>
                <dd className="flex-1 min-w-0 font-mono text-xs text-[#dddddd] leading-5">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">What&apos;s different in {f.name}</h2>
          <ul className="space-y-2">
            {page.notes.map((n) => (
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
            {page.faq.map((x) => (
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
            {FLAVORS.filter((x) => x.slug !== f.slug).map((x) => (
              <Link key={x.slug} href={`/tools/regex-tester/${x.slug}`} className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#888] hover:text-[#a855f7]">
                {x.name} regex tester
              </Link>
            ))}
            <Link href="/blog/regex-flavors-compared" className="px-3 py-1.5 text-xs text-[#a855f7] hover:underline">
              Guide: regex flavors compared →
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
