import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FakeDataGeneratorClient from "../FakeDataGeneratorClient";
import { FAKE_DATA_PAGES, fakeDataPage } from "@/lib/fake-data-pages";
import { buildSql, generateRows } from "@/lib/fake-data";
import { jsonToCsv } from "@/lib/csv-json";

export const dynamicParams = false;
export const generateStaticParams = () => FAKE_DATA_PAGES.map((p) => ({ format: p.slug }));

export function generateMetadata({ params }: { params: { format: string } }): Metadata {
  const p = fakeDataPage(params.format);
  if (!p) return {};
  const url = `https://toolninja.io/tools/fake-data-generator/${p.slug}`;
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url },
    openGraph: { url, title: p.heading, description: p.description },
  };
}

/** A few rows of what the page generates, rendered into the HTML. Seeded, so it's the same on every build */
function sample(slug: string): string {
  const p = fakeDataPage(slug)!;
  const rows = generateRows(p.fields, 3, `toolninja-${p.slug}`);
  if (p.format === "sql") return buildSql(rows, p.table, p.dialect ?? "postgres", { createTable: true });
  if (p.format === "csv") return jsonToCsv(rows);
  return JSON.stringify(rows, null, 2);
}

export default function FakeDataFormatPage({ params }: { params: { format: string } }) {
  const p = fakeDataPage(params.format);
  if (!p) notFound();
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <FakeDataGeneratorClient initialFormat={p.format} initialDialect={p.dialect} initialTable={p.table} initialFields={p.fields} heading={p.heading} intro={p.intro} pageSlug={p.slug} />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Example output</h2>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#bbbbbb] overflow-x-auto whitespace-pre-wrap break-all">{sample(p.slug)}</pre>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Loading it</h2>
          <div className="space-y-3">
            {p.load.map((l) => (
              <div key={l.label}>
                <p className="text-xs text-[#888] mb-1">{l.label}</p>
                <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#d4d4d4] overflow-x-auto whitespace-pre-wrap break-all">{l.code}</pre>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">How the {p.name} output is built</h2>
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

        <p className="text-sm text-[#888]">
          Everything is generated in your browser. Need the data in another shape? Convert it with <Link href="/tools/csv-json" className="text-[#a855f7] hover:underline">CSV ↔ JSON</Link>, or describe its structure first with the{" "}
          <Link href="/tools/json-schema-generator" className="text-[#a855f7] hover:underline">JSON Schema Generator</Link>.
        </p>
      </div>
    </>
  );
}
