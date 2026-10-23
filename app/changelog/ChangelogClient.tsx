"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Plus, TrendingUp, BookOpen, Wrench, Rss } from "lucide-react";
import type { ChangeKind } from "@/lib/changelog";

export interface ResolvedItem {
  kind: ChangeKind;
  title?: string;
  text?: string;
  href?: string;
  chips?: { name: string; href: string }[];
}

export interface ResolvedRelease {
  id: string;
  date: string;
  dateLabel: string;
  month: string;
  title: string;
  summary: string;
  items: ResolvedItem[];
}

const KINDS: Record<ChangeKind, { label: string; plural: string; color: string; Icon: typeof Plus }> = {
  feature: { label: "Feature", plural: "Features", color: "#a855f7", Icon: Sparkles },
  new: { label: "New tool", plural: "New tools", color: "#22c55e", Icon: Plus },
  improved: { label: "Improved", plural: "Improvements", color: "#60a5fa", Icon: TrendingUp },
  guide: { label: "Guide", plural: "Guides", color: "#f59e0b", Icon: BookOpen },
  fix: { label: "Fix", plural: "Fixes", color: "#f43f5e", Icon: Wrench },
};
const ORDER: ChangeKind[] = ["feature", "new", "improved", "guide", "fix"];

function countOf(releases: ResolvedRelease[], kind: ChangeKind) {
  return releases.reduce((n, r) => n + r.items.filter((i) => i.kind === kind).reduce((m, i) => m + (i.chips?.length || 1), 0), 0);
}

function ItemRow({ item }: { item: ResolvedItem }) {
  const { color } = KINDS[item.kind];
  const title = item.title && (
    <span className="font-medium text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors">{item.title}</span>
  );
  const body = (
    <>
      {title}
      {item.title && item.text && <span className="text-[#555555]"> — </span>}
      {item.text && <span className={item.title ? "text-[#999999]" : "text-[#cccccc] group-hover:text-[#f5f5f5] transition-colors"}>{item.text}</span>}
    </>
  );
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed">
      <span className="mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        {item.href ? (
          <Link href={item.href} className="group">
            {body}
          </Link>
        ) : (
          <span>{body}</span>
        )}
        {item.chips && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {item.chips.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="px-2 py-0.5 text-xs text-[#aaaaaa] bg-[#151515] border border-[#262626] rounded-[6px] hover:text-[#f5f5f5] hover:border-[#a855f7]/50 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export default function ChangelogClient({ releases }: { releases: ResolvedRelease[] }) {
  const [filter, setFilter] = useState<ChangeKind | "all">("all");

  const visible = releases
    .map((r) => ({ ...r, items: filter === "all" ? r.items : r.items.filter((i) => i.kind === filter) }))
    .filter((r) => r.items.length > 0);

  const chips: { key: ChangeKind | "all"; label: string; count: number }[] = [
    { key: "all", label: "Everything", count: releases.length },
    ...ORDER.map((k) => ({ key: k, label: KINDS[k].plural, count: countOf(releases, k) })),
  ];

  let lastMonth = "";

  return (
    <>
      <div className="sticky top-16 md:top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-[#0a0a0a]/85 backdrop-blur border-b border-[#1a1a1a]">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {chips.map((c) => {
            const active = filter === c.key;
            const color = c.key === "all" ? "#a855f7" : KINDS[c.key].color;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  active ? "text-[#f5f5f5]" : "text-[#888888] border-[#262626] hover:text-[#f5f5f5] hover:border-[#3a3a3a]"
                }`}
                style={active ? { borderColor: `${color}99`, background: `${color}1f` } : undefined}
              >
                {c.label}
                <span className="text-[10px] tabular-nums" style={{ color: active ? color : "#555555" }}>
                  {c.key === "all" ? `${c.count} releases` : c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ol className="relative">
        {/* timeline rail */}
        <span aria-hidden className="hidden sm:block absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#a855f7]/60 via-[#262626] to-[#262626]" />
        {visible.map((r, idx) => {
          const showMonth = r.month !== lastMonth;
          lastMonth = r.month;
          const latest = r.id === releases[0].id;
          return (
            <li key={r.id} className="relative sm:pl-9">
              {showMonth && (
                <h2 className={`text-xs font-semibold uppercase tracking-[0.18em] text-[#555555] mb-4 ${idx === 0 ? "" : "mt-12"}`}>{r.month}</h2>
              )}
              <span
                aria-hidden
                className={`hidden sm:block absolute left-0 top-[calc(theme(spacing.6)+1px)] w-[15px] h-[15px] rounded-full border-2 ${
                  latest ? "bg-[#a855f7] border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.8)]" : "bg-[#0a0a0a] border-[#3a3a3a]"
                } ${showMonth ? "mt-[34px]" : ""}`}
              />
              <article
                id={r.id}
                className={`scroll-mt-20 mb-5 p-5 sm:p-6 rounded-[14px] border ${
                  latest ? "bg-gradient-to-br from-[#a855f7]/[0.09] to-[#0f0f10] border-[#a855f7]/35" : "bg-[#0f0f10] border-[#1f1f1f]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <a href={`#${r.id}`} className="text-xs font-mono text-[#777777] hover:text-[#a855f7]">
                    <time dateTime={r.date}>{r.dateLabel}</time>
                  </a>
                  {latest && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a855f7] bg-[#a855f7]/15 rounded">Latest</span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#f5f5f5] mb-1.5">{r.title}</h3>
                <p className="text-sm text-[#888888] leading-relaxed mb-5">{r.summary}</p>

                <div className="space-y-5">
                  {ORDER.filter((k) => r.items.some((i) => i.kind === k)).map((k) => {
                    const { plural, color, Icon } = KINDS[k];
                    const items = r.items.filter((i) => i.kind === k);
                    return (
                      <section key={k}>
                        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color }}>
                          <Icon size={12} /> {plural}
                        </h4>
                        <ul className="space-y-1.5">
                          {items.map((item, i) => (
                            <ItemRow key={i} item={item} />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex justify-center">
        <a
          href="/changelog/rss.xml"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#888888] border border-[#262626] rounded-full hover:text-[#f59e0b] hover:border-[#f59e0b]/40 transition-colors"
        >
          <Rss size={12} /> Follow updates via RSS
        </a>
      </div>
    </>
  );
}
