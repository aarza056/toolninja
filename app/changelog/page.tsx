import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { resolveReleases } from "@/lib/changelog-resolve";
import ChangelogClient from "./ChangelogClient";

const PAGE_URL = "https://toolninja.io/changelog";

export const metadata: Metadata = {
  title: "Changelog — New Tools, Features & Fixes",
  description:
    "Everything shipped on ToolNinja, newest first: new developer tools, improvements to existing ones, guides and fixes. Follow along via RSS.",
  alternates: {
    canonical: PAGE_URL,
    types: { "application/rss+xml": [{ url: "https://toolninja.io/changelog/rss.xml", title: "ToolNinja Changelog" }] },
  },
};

export default function ChangelogPage() {
  const releases = resolveReleases();
  const first = releases[releases.length - 1];
  const stats = [
    { value: tools.length, label: "tools" },
    { value: getAllPosts().length, label: "guides" },
    { value: releases.length, label: "releases" },
    { value: first.dateLabel.replace(/ \d+,/, ""), label: "shipping since" },
  ];

  return (
    <div className="px-4 sm:px-6 pt-20 pb-10 md:pt-10 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f5]">Changelog</h1>
          <a
            href="/changelog/rss.xml"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#888888] border border-[#262626] rounded-full hover:text-[#f59e0b] hover:border-[#f59e0b]/40 transition-colors"
          >
            <Rss size={12} /> RSS
          </a>
        </div>
        <p className="text-sm text-[#888888] leading-relaxed max-w-xl">
          Everything we&apos;ve shipped, newest first — new tools, upgrades to the ones you already use, guides and fixes. Looking
          for something specific?{" "}
          <Link href="/ask" className="text-[#a855f7] hover:underline">
            Ask Ninja
          </Link>{" "}
          or browse{" "}
          <Link href="/tools" className="text-[#a855f7] hover:underline">
            all tools
          </Link>
          .
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse px-4 py-3 bg-[#0f0f10] border border-[#1f1f1f] rounded-[10px]">
              <dt className="text-[11px] text-[#666666] uppercase tracking-wider">{s.label}</dt>
              <dd className="text-xl font-bold text-[#f5f5f5] tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <ChangelogClient releases={releases} />
    </div>
  );
}
