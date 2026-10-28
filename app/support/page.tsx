import type { Metadata } from "next";
import Link from "next/link";
import { Check, Server, Sparkles, Hammer, BookOpen, Lock, Share2, Bell } from "lucide-react";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { releases } from "@/lib/changelog";
import { SUPPORT_TIERS, PATREON_URL } from "@/lib/support";
import PatreonLink, { PatreonIcon } from "@/components/support/PatreonLink";
import { YouTubeIcon } from "@/components/videos/PageVideos";
import { YOUTUBE_CHANNEL_URL } from "@/lib/videos";

const PAGE_URL = "https://toolninja.io/support";

export const metadata: Metadata = {
  title: "Support ToolNinja — Keep Free Developer Tools Free",
  description:
    "ToolNinja's developer tools are free, with no login and no paywall. Support the project on Patreon to cover hosting and Ninja AI, and keep new tools coming.",
  alternates: { canonical: PAGE_URL },
};

const FAQS = [
  {
    q: "Is ToolNinja going to become paid?",
    a: "No. Every tool stays free for everyone, with no login and no paywall. Support is optional and never unlocks a tool someone else can't use.",
  },
  {
    q: "Who handles the payment?",
    a: "Patreon. ToolNinja never sees your card details. You can change or cancel your membership on Patreon at any time.",
  },
  {
    q: "Can I support without paying?",
    a: "Yes. Join for free on Patreon to get development updates, share a tool with a teammate, or link to a guide that helped you. All of it helps.",
  },
  {
    q: "What does the money pay for?",
    a: "Hosting and bandwidth, the AI behind Ask Ninja (every answer costs real money), and the time it takes to build and test new tools and guides.",
  },
];

export default function SupportPage() {
  const shipped = [
    { value: tools.length, label: "free tools" },
    { value: getAllPosts().length, label: "guides" },
    { value: releases.length, label: "releases since May" },
  ];
  const funds = [
    { Icon: Server, title: "Hosting & bandwidth", text: "Fast pages everywhere, for every visitor." },
    { Icon: Sparkles, title: "Ninja AI", text: "Every Ask Ninja answer is a paid AI call. Supporters keep it switched on." },
    { Icon: Hammer, title: "New tools", text: "New tools ship every few days — researched, built and tested." },
    { Icon: BookOpen, title: "Guides", text: "Fix-it guides for the errors developers search for most." },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ToolNinja", item: "https://toolninja.io" },
        { "@type": "ListItem", position: 2, name: "Support", item: PAGE_URL },
      ],
    },
  ];

  return (
    <div className="px-4 sm:px-6 pt-20 pb-16 md:pt-12 max-w-3xl mx-auto">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}

      <header className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-5 text-xs font-medium text-[#ff6b73] bg-[#ff424d]/10 border border-[#ff424d]/25 rounded-full">
          <PatreonIcon size={11} /> ToolNinja is on Patreon
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f5] mb-3">Keep ToolNinja free</h1>
        <p className="text-[15px] text-[#888888] leading-relaxed max-w-xl mx-auto">
          No login, no paywall, and every tool runs in your browser. That&apos;s not changing. If ToolNinja saves you time, you
          can help keep it that way.
        </p>
        <dl className="flex justify-center gap-8 mt-7">
          {shipped.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="text-[11px] text-[#666666] uppercase tracking-wider">{s.label}</dt>
              <dd className="text-2xl font-bold text-[#f5f5f5] tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Tiers */}
      <section aria-labelledby="tiers" className="mb-12">
        <h2 id="tiers" className="sr-only">
          Membership
        </h2>
        <div className="grid gap-4">
          {SUPPORT_TIERS.map((t) => (
            <div
              key={t.name}
              className="relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-[#ff424d]/[0.1] via-[#111111] to-[#a855f7]/[0.08] border border-[#ff424d]/30 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6b73] mb-1">Membership</p>
                  <h3 className="text-xl font-bold text-[#f5f5f5]">{t.name}</h3>
                  <p className="mt-1 mb-4">
                    <span className="text-3xl font-bold text-[#f5f5f5]">${t.price}</span>
                    <span className="text-sm text-[#888888]"> / month</span>
                    {t.trial && <span className="ml-2 text-xs text-[#22c55e]">· {t.trial}</span>}
                  </p>
                  <ul className="space-y-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-[#cccccc]">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#ff6b73]" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:w-48 flex flex-col gap-2">
                  <PatreonLink
                    placement="support-page"
                    className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#ff424d] hover:bg-[#e63a44] rounded-[10px] shadow-lg shadow-[#ff424d]/20 transition-colors"
                  >
                    <PatreonIcon size={14} /> Join on Patreon
                  </PatreonLink>
                  <p className="text-[11px] text-[#666666] text-center">Cancel anytime on Patreon</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Where it goes */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-[#f5f5f5] mb-4">Where your support goes</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {funds.map(({ Icon, title, text }) => (
            <div key={title} className="p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl">
              <Icon size={16} className="text-[#a855f7] mb-2" />
              <p className="text-sm font-semibold text-[#f5f5f5] mb-1">{title}</p>
              <p className="text-xs text-[#888888] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Promise */}
      <section className="mb-12 p-5 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#f5f5f5] mb-3">
          <Lock size={14} className="text-[#22c55e]" /> What never changes
        </h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#aaaaaa]">
          {["Every tool free for everyone", "No account or login", "Your data stays in your browser", "No tool locked behind a tier"].map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check size={14} className="shrink-0 text-[#22c55e]" /> {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Free ways */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-[#f5f5f5] mb-4">Other ways to help — for free</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <a href={PATREON_URL} target="_blank" rel="noopener noreferrer" className="group p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl hover:border-[#ff424d]/40 transition-colors">
            <Bell size={16} className="text-[#ff6b73] mb-2" />
            <p className="text-sm font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#ff6b73]">Follow for free on Patreon</p>
            <p className="text-xs text-[#888888]">Get development updates without paying anything.</p>
          </a>
          <Link href="/tools" className="group p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl hover:border-[#a855f7]/40 transition-colors">
            <Share2 size={16} className="text-[#a855f7] mb-2" />
            <p className="text-sm font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#a855f7]">Share a tool you like</p>
            <p className="text-xs text-[#888888]">Send it to a teammate or link it in your docs and READMEs.</p>
          </Link>
          <a
            href={`${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="group sm:col-span-2 p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl hover:border-[#ff4d4d]/40 transition-colors"
          >
            <span className="block text-[#ff6b6b] mb-2">
              <YouTubeIcon size={16} />
            </span>
            <p className="text-sm font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#ff6b6b]">Subscribe on YouTube</p>
            <p className="text-xs text-[#888888]">Short video guides for the tools. Likes and comments help other developers find them.</p>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-lg font-bold text-[#f5f5f5] mb-4">Questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl">
              <h3 className="text-sm font-semibold text-[#f5f5f5] mb-1.5">{f.q}</h3>
              <p className="text-sm text-[#888888] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
