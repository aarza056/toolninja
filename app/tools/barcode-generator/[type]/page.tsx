import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BarcodeGeneratorClient from "../BarcodeGeneratorClient";
import { BARCODE_PAGES } from "@/lib/barcode-pages";

export const dynamicParams = false;
export const generateStaticParams = () => BARCODE_PAGES.map((p) => ({ type: p.slug }));

const pageFor = (slug: string) => BARCODE_PAGES.find((p) => p.slug === slug);

export function generateMetadata({ params }: { params: { type: string } }): Metadata {
  const p = pageFor(params.type);
  if (!p) return {};
  const url = `https://toolninja.io/tools/barcode-generator/${p.slug}`;
  return {
    title: `${p.name} Barcode Generator — Free PNG & SVG`,
    description: `Create ${p.name} barcodes online with the check digit calculated for you. Download PNG or SVG — free, no sign-up, made in your browser.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${p.name} Barcode Generator` },
  };
}

export default function BarcodeTypePage({ params }: { params: { type: string } }) {
  const p = pageFor(params.type);
  if (!p) notFound();
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BarcodeGeneratorClient initialFormat={p.format} heading={`${p.name} Barcode Generator`} intro={p.usedFor} />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">{p.name} at a glance</h2>
          <dl className="divide-y divide-[#1a1a1a] border border-[#222222] rounded-[8px]">
            {p.facts.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-sm">
                <dt className="w-32 shrink-0 text-[#888888]">{k}</dt>
                <dd className="flex-1 min-w-0 text-[#dddddd]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Good to know</h2>
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
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Other barcode types</h2>
          <div className="flex flex-wrap gap-2">
            {BARCODE_PAGES.filter((x) => x.slug !== p.slug).map((x) => (
              <Link key={x.slug} href={`/tools/barcode-generator/${x.slug}`} className="px-3 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#888] hover:text-[#a855f7]">
                {x.name} generator
              </Link>
            ))}
            <Link href="/tools/qr-code-generator" className="px-3 py-1.5 text-xs text-[#a855f7] hover:underline">
              QR codes →
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
