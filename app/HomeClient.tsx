"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { tools, categories } from "@/lib/tools";
import type { Tool } from "@/lib/tools";
import * as LucideIcons from "lucide-react";
import { Search, X } from "lucide-react";

type FilterCategory = typeof categories[number] | "All";

const FEATURED_SLUGS = [
  "json-formatter",
  "regex-tester",
  "diff-checker",
  "jwt-generator",
  "crypto-tools",
  "color-palette",
];

const NEW_SLUGS = new Set([
  "sql-formatter","color-palette","jwt-generator","crypto-tools",
  "http-request","html-formatter","config-validator","text-diff",
  "cidr-calculator","unicode-explorer",
]);

const CATEGORY_COLORS: Record<string, string> = {
  Format:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Encode:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Generate:  "bg-green-500/10 text-green-400 border-green-500/20",
  Convert:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Test:      "bg-red-500/10 text-red-400 border-red-500/20",
  Design:    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Security:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Reference: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

function ToolIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  )[name];
  if (!Icon) return null;
  return <Icon size={size} className="text-[#a855f7]" />;
}

function ToolCard({ tool, featured = false }: { tool: Tool; featured?: boolean }) {
  const isNew = NEW_SLUGS.has(tool.slug);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col gap-3 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/50 hover:bg-[#1a1a1a] transition-all duration-150 overflow-hidden ${featured ? "p-6" : "p-5"}`}
    >
      {isNew && (
        <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 bg-[#a855f7]/15 text-[#a855f7] rounded-[4px] font-semibold tracking-wider">
          NEW
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="p-2 bg-[#1a1a1a] rounded-[6px] group-hover:bg-[#a855f7]/10 transition-colors">
          <ToolIcon name={tool.icon} size={featured ? 22 : 18} />
        </div>
        {!isNew && (
          <span className={`text-[10px] px-2 py-0.5 rounded-[4px] border ${CATEGORY_COLORS[tool.category] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
            {tool.category}
          </span>
        )}
      </div>
      <div>
        <h3 className={`font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#a855f7] transition-colors ${featured ? "text-base" : "text-sm"}`}>
          {tool.name}
        </h3>
        <p className="text-xs text-[#888888] leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}

const WHY_ITEMS = [
  {
    icon: "Lock",
    title: "Private by default",
    desc: "Your code and data never leave the browser. No server calls, no logs, no telemetry of any kind.",
  },
  {
    icon: "Zap",
    title: "Zero setup",
    desc: "Open a tool and start working. No installs, no accounts, no configuration required.",
  },
  {
    icon: "Code2",
    title: "Built for depth",
    desc: "Tools go deep — match tables, tree views, char-level diffs, WebCrypto, JSONPath, CIDR math.",
  },
  {
    icon: "WifiOff",
    title: "Works offline",
    desc: "All logic runs in your browser. Once loaded, no internet connection required.",
  },
] as const;

export default function HomeClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");

  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeCategory !== "All") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  const featuredTools = tools.filter((t) => FEATURED_SLUGS.includes(t.slug));
  const isFiltering = search.trim() !== "" || activeCategory !== "All";

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      {/* Hero ─────────────────────────────────────────────────────────────── */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-full text-xs text-[#a855f7] mb-6 font-medium">
          <span>🥷</span>
          <span>{tools.length} tools · 0 accounts · 100% browser</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-[#f5f5f5] to-[#888888] bg-clip-text text-transparent">
            The dev toolbox
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#a855f7] to-[#3b82f6] bg-clip-text text-transparent">
            you&apos;ve been looking for.
          </span>
        </h1>

        <p className="text-[#666666] text-base max-w-md mx-auto mb-8 leading-relaxed">
          Fast, free, private. Every tool runs entirely in your browser —
          no login, no tracking, no server calls.
        </p>

        {/* Search */}
        <div className="relative max-w-sm mx-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tools.length} tools…`}
            className="w-full pl-10 pr-9 py-2.5 bg-[#111111] border border-[#222222] rounded-[8px] text-sm text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#333333] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888] transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-10">
        {(["All", ...categories] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors ${
              activeCategory === cat
                ? "bg-[#a855f7] border-[#a855f7] text-white"
                : "bg-[#111111] border-[#222222] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured ─────────────────────────────────────────────────────────── */}
      {!isFiltering && (
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-[#555555] uppercase tracking-wider mb-4">
            <span className="text-[#a855f7]">★</span> Featured
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTools.map((t) => (
              <ToolCard key={t.slug} tool={t} featured />
            ))}
          </div>
        </div>
      )}

      {/* Filtered results or full category list ──────────────────────────── */}
      {isFiltering ? (
        <div>
          <h2 className="text-xs font-semibold text-[#555555] uppercase tracking-wider mb-4">
            {filteredTools.length} result{filteredTools.length !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
          </h2>
          {filteredTools.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#222222] rounded-[8px] text-[#444444] text-sm">
              No tools found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          )}
        </div>
      ) : (
        categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          if (catTools.length === 0) return null;
          return (
            <div key={cat} className="mb-10">
              <h2 className="text-xs font-semibold text-[#555555] uppercase tracking-wider mb-4">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catTools.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Why ToolNinja ────────────────────────────────────────────────────── */}
      {!isFiltering && (
        <div className="mt-16 pt-12 border-t border-[#161616]">
          <h2 className="text-xs font-semibold text-[#444444] uppercase tracking-wider mb-8 text-center">
            Why ToolNinja
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_ITEMS.map((item) => {
              const Icon = (
                LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
              )[item.icon];
              return (
                <div key={item.title} className="p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[8px]">
                  <div className="mb-3">
                    {Icon && <Icon size={18} className="text-[#a855f7]" />}
                  </div>
                  <h3 className="text-sm font-semibold text-[#d4d4d4] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#555555] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-[#333333] mt-10">
            <Link href="/privacy" className="hover:text-[#555555] transition-colors">Privacy Policy</Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-[#555555] transition-colors">Terms of Service</Link>
          </p>
        </div>
      )}
    </div>
  );
}
