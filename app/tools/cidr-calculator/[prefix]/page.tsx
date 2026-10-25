import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prefixFacts, PREFIX_USES, numToIp } from "@/lib/cidr-info";
import CidrCalculatorClient from "../CidrCalculatorClient";
import CidrCheatSheet from "../CidrCheatSheet";

// One page per prefix length (/0–/32): the facts people search for ("/24 subnet mask",
// "how many IPs in a /22") plus the calculator pre-filled with that size.

const PREFIXES = Array.from({ length: 33 }, (_, i) => i);
export const dynamicParams = false;
export const generateStaticParams = () => PREFIXES.map((p) => ({ prefix: String(p) }));

const n = (v: number) => v.toLocaleString("en-US");
const parse = (raw: string) => (/^\d{1,2}$/.test(raw) && Number(raw) <= 32 ? Number(raw) : null);

/** An example network of this size, from a private range where possible. */
function example(p: number): string {
  if (p === 0) return "0.0.0.0/0";
  if (p < 8) return `${numToIp(0)}/${p}`;
  if (p < 16) return `10.0.0.0/${p}`;
  return `${p >= 24 ? "192.168.1.0" : "10.0.0.0"}/${p}`;
}

export function generateMetadata({ params }: { params: { prefix: string } }): Metadata {
  const p = parse(params.prefix);
  if (p === null) return {};
  const f = prefixFacts(p);
  const url = `https://toolninja.io/tools/cidr-calculator/${p}`;
  return {
    title: `/${p} CIDR: Subnet Mask ${f.mask}, ${n(f.total)} IPs`,
    description: `A /${p} network has ${n(f.total)} addresses (${n(f.usable)} usable hosts) and subnet mask ${f.mask}. Wildcard, binary mask, AWS usable count and how it splits — with a calculator.`,
    alternates: { canonical: url },
    openGraph: { url, title: `/${p} subnet — mask ${f.mask}` },
  };
}

export default function PrefixPage({ params }: { params: { prefix: string } }) {
  const p = parse(params.prefix);
  if (p === null) notFound();
  const f = prefixFacts(p);
  const splits = [1, 2, 3, 4].map((d) => p + d).filter((x) => x <= 32);
  const facts: [string, string][] = [
    ["Subnet mask", f.mask],
    ["Wildcard mask", f.wildcard],
    ["Mask in binary", f.binaryMask],
    ["Host bits", String(f.hostBits)],
    ["Total addresses", n(f.total)],
    ["Usable hosts", `${n(f.usable)}${p <= 30 ? " (network and broadcast address excluded)" : ""}`],
    ...(f.awsUsable !== null ? ([["Usable in an AWS or Azure subnet", `${n(f.awsUsable)} (5 reserved per subnet)`]] as [string, string][]) : []),
    ...(f.slash24s !== null && p < 24 ? ([["Equivalent /24 networks", n(f.slash24s)]] as [string, string][]) : []),
  ];
  const faq = [
    { q: `What is the subnet mask for /${p}?`, a: `${f.mask}. The first ${p} bits are network bits and the remaining ${f.hostBits} are host bits; the wildcard (inverse) mask is ${f.wildcard}.` },
    {
      q: `How many IP addresses are in a /${p}?`,
      a: `${n(f.total)} in total. ${p <= 30 ? `${n(f.usable)} of them can be assigned to hosts, because the first is the network address and the last is the broadcast address.` : p === 31 ? "Both are usable on point-to-point links (RFC 3021)." : "It is exactly one address."}${f.awsUsable !== null ? ` In an AWS VPC or Azure subnet, ${n(f.awsUsable)} are usable because 5 are reserved.` : ""}`,
    },
  ];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <CidrCalculatorClient
        initialInput={example(p)}
        heading={`/${p} subnet: mask ${f.mask}, ${n(f.total)} addresses`}
        intro={`Everything about a /${p} network, with the CIDR calculator pre-filled — change the IP to calculate your own block.`}
      />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">/{p} at a glance</h2>
          <dl className="divide-y divide-[#1a1a1a] border border-[#222222] rounded-[8px]">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                <dt className="text-[#888888]">{k}</dt>
                <dd className="font-mono text-[#f5f5f5]">{v}</dd>
              </div>
            ))}
          </dl>
          {PREFIX_USES[p] && <p className="mt-3 text-sm text-[#bbbbbb] leading-relaxed">{PREFIX_USES[p]}</p>}
        </section>

        {splits.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Splitting a /{p} into smaller subnets</h2>
            <ul className="space-y-1.5 text-sm text-[#bbbbbb]">
              {splits.map((s) => (
                <li key={s}>
                  {n(2 ** (s - p))} ×{" "}
                  <Link href={`/tools/cidr-calculator/${s}`} className="font-mono text-[#c4b5fd] hover:underline">
                    /{s}
                  </Link>{" "}
                  — {n(prefixFacts(s).total)} addresses each ({n(prefixFacts(s).usable)} usable)
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Frequently asked</h2>
          <div className="space-y-4">
            {faq.map((x) => (
              <div key={x.q} className="border-l-2 border-[#a855f7]/40 pl-4">
                <h3 className="text-sm font-medium text-[#dddddd]">{x.q}</h3>
                <p className="text-sm text-[#999999] mt-1 leading-relaxed">{x.a}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="flex justify-between text-sm">
          {p > 0 ? (
            <Link href={`/tools/cidr-calculator/${p - 1}`} className="text-[#a855f7] hover:underline">
              ← /{p - 1}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/tools/cidr-calculator" className="text-[#888888] hover:text-[#f5f5f5]">
            CIDR calculator
          </Link>
          {p < 32 ? (
            <Link href={`/tools/cidr-calculator/${p + 1}`} className="text-[#a855f7] hover:underline">
              /{p + 1} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
      <CidrCheatSheet current={p} />
    </>
  );
}
