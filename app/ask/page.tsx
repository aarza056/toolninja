import type { Metadata } from "next";
import Link from "next/link";
import AskPageClient from "@/components/assistant/AskPageClient";
import { ShortVideo } from "@/components/videos/PageVideos";
import { videosForPage } from "@/lib/videos";
import { getVideos } from "@/lib/video-store";

const BASE_URL = "https://toolninja.io";
const PAGE_URL = `${BASE_URL}/ask`;
const TITLE = "Ask Ninja — Paste Anything, Identify & Decode It";
const DESCRIPTION =
  "Paste a JWT, certificate, cron expression, cURL command, error or screenshot. Ninja identifies and decodes it in your browser and points you to the right tool.";
const OG = `/api/og?title=${encodeURIComponent("Ask Ninja")}&desc=${encodeURIComponent("Paste anything. Ninja tells you what it is.")}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: `${TITLE} | ToolNinja`, description: DESCRIPTION, url: PAGE_URL, images: [{ url: OG, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG] },
};

const RECOGNIZES: { label: string; slug: string }[] = [
  { label: "JWT tokens", slug: "jwt-decoder" },
  { label: "TLS / X.509 certificates and chains", slug: "certificate-decoder" },
  { label: "SSH public keys", slug: "ssh-key-generator" },
  { label: "Cron expressions", slug: "cron-tester" },
  { label: "Unix timestamps and ISO dates", slug: "timestamp-converter" },
  { label: "UUIDs and ULIDs", slug: "uuid-parser" },
  { label: "IP addresses, CIDR blocks, ranges and subnet masks", slug: "cidr-calculator" },
  { label: "cURL commands", slug: "curl-to-code" },
  { label: "docker run commands", slug: "docker-run-to-compose" },
  { label: "Database connection strings", slug: "connection-string-parser" },
  { label: "JSON, package.json and tsconfig", slug: "json-formatter" },
  { label: "Base64 and Base64URL", slug: "base64" },
  { label: "URL-encoded text and URLs", slug: "url-encoder" },
  { label: "bcrypt hashes", slug: "bcrypt-hash-generator" },
  { label: "2FA otpauth:// links and QR codes", slug: "totp-generator" },
  { label: "Colors (hex, rgb)", slug: "color-converter" },
  { label: "User-Agent strings", slug: "user-agent-parser" },
  { label: "npm version ranges", slug: "semver-calculator" },
  { label: "SQL queries", slug: "sql-formatter" },
  { label: "Regular expressions", slug: "regex-tester" },
  { label: "Unix permissions (755, rwxr-xr-x)", slug: "chmod-calculator" },
  { label: "MD5 / SHA hashes", slug: "hash-generator" },
  { label: "IBANs", slug: "iban-validator" },
  { label: "HTML, XML and SVG", slug: "html-formatter" },
];

const FAQ = [
  {
    q: "Is what I paste uploaded anywhere?",
    a: "Not unless you ask the AI. Recognizing and decoding what you paste — tokens, certificates, timestamps, and everything in the list above — happens entirely in your browser. Only when you press “Ask Ninja AI” is your text (or image) sent to our AI provider to write an answer, and Ninja warns you first if it looks like it contains a secret.",
  },
  {
    q: "What can I ask Ninja AI?",
    a: "Any developer problem: paste an error message or a screenshot of one, describe what you're trying to do (“convert my docker run command to compose”), or ask what something means. Ninja gives a short answer and links the ToolNinja tools and guides that solve it.",
  },
  {
    q: "Is it free?",
    a: "Yes. There's no account and no charge. To keep it that way the AI has a fair-use limit per visitor; the in-browser detection and tool finder have no limit at all.",
  },
  {
    q: "Can the AI be wrong?",
    a: "Occasionally, yes — that's why every answer links the exact tools for the job. The decoding and detection results come from deterministic code, not the AI, so those are exact.",
  },
];

export default async function AskPage() {
  const short = videosForPage(await getVideos(), "/ask").find((v) => v.format === "short");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Ask Ninja",
      url: PAGE_URL,
      description: DESCRIPTION,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "ToolNinja", url: BASE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ToolNinja", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Ask Ninja", item: PAGE_URL },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <AskPageClient />

      <h1 className="mt-10 text-2xl sm:text-3xl font-bold text-[#f5f5f5]">Paste anything. Ninja figures out what it is.</h1>
      <p className="mt-3 text-[#888888] leading-relaxed">
        A JWT from a failing request, a certificate that&apos;s about to expire, a cron line that fires at the wrong time, a stack trace from
        your terminal — paste it in and Ninja identifies it, decodes it on the spot, and sends you to the tool that handles it. Describe a
        problem in plain words, or drop in a screenshot, and Ninja AI explains it.
      </p>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        <section className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">How it works</h2>
          <ol className="space-y-2 text-sm text-[#888888] leading-relaxed list-decimal pl-5">
            <li>
              <strong className="text-[#cccccc]">Instant, in your browser.</strong> As you paste, Ninja runs the same parsers our{" "}
              <Link href="/tools" className="text-[#a855f7] hover:underline">tools</Link> use — nothing leaves your device.
            </li>
            <li>
              <strong className="text-[#cccccc]">The right tool, one click away.</strong> Every result links the tool that does the full job.
            </li>
            <li>
              <strong className="text-[#cccccc]">AI when you want it.</strong> Press “Ask Ninja AI” for an explanation of an error, a
              screenshot, or a problem in your own words.
            </li>
          </ol>
        </section>
        {short && (
          <aside className="w-full max-w-[240px] mx-auto shrink-0 sm:mx-0 sm:w-[220px]">
            <ShortVideo video={short} heading="Watch it work" />
          </aside>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">What Ninja recognizes instantly</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {RECOGNIZES.map((r) => (
            <li key={r.label}>
              <Link href={`/tools/${r.slug}`} className="text-sm text-[#888888] hover:text-[#a855f7] transition-colors">
                → {r.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#666666]">
          Plus error messages, matched against our <Link href="/blog" className="text-[#a855f7] hover:underline">error guides</Link>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Frequently asked questions</h2>
        <div className="space-y-5">
          {FAQ.map((f) => (
            <div key={f.q} className="border-l-2 border-[#222] pl-4">
              <h3 className="text-sm font-medium text-[#aaaaaa] mb-1.5">{f.q}</h3>
              <p className="text-sm text-[#666666] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
