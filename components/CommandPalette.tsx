"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tools } from "@/lib/tools";
import type { Tool } from "@/lib/tools";
import { getRecentTools, getFavoriteTools } from "@/lib/user-prefs";
import { Search } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Format:    "bg-purple-500/15 text-purple-400",
  Encode:    "bg-blue-500/15 text-blue-400",
  Generate:  "bg-green-500/15 text-green-400",
  Convert:   "bg-orange-500/15 text-orange-400",
  Test:      "bg-red-500/15 text-red-400",
  Design:    "bg-pink-500/15 text-pink-400",
  Security:  "bg-yellow-500/15 text-yellow-400",
  Reference: "bg-cyan-500/15 text-cyan-400",
};

function searchTools(query: string): Tool[] {
  const q = query.toLowerCase();
  return tools
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    )
    .slice(0, 10);
}

const optionId = (slug: string) => `palette-option-${slug}`;

function ResultItem({
  tool,
  isHighlighted,
  onNavigate,
  onHover,
}: {
  tool: Tool;
  isHighlighted: boolean;
  onNavigate: (slug: string) => void;
  onHover: () => void;
}) {
  return (
    <div
      id={optionId(tool.slug)}
      role="option"
      aria-selected={isHighlighted}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
        isHighlighted ? "bg-[#1f1f1f] shadow-[inset_2px_0_0_#a855f7]" : "hover:bg-[#161616]"
      }`}
      onClick={() => onNavigate(tool.slug)}
      onMouseEnter={onHover}
    >
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
          CATEGORY_COLORS[tool.category] ?? "bg-gray-500/15 text-gray-400"
        }`}
      >
        {tool.category}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#f5f5f5]">{tool.name}</p>
        <p className="text-xs text-[#999999] truncate">{tool.description}</p>
      </div>
      {isHighlighted && (
        <span className="text-xs text-[#999999] flex-shrink-0" aria-hidden="true">↵</span>
      )}
    </div>
  );
}

function SectionGroup({
  label,
  items,
  highlighted,
  offset,
  onNavigate,
  onHover,
}: {
  label: string;
  items: Tool[];
  highlighted: number;
  offset: number;
  onNavigate: (slug: string) => void;
  onHover: (idx: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div role="group" aria-label={label}>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-[#888888] uppercase tracking-wider" aria-hidden="true">
        {label}
      </p>
      {items.map((tool, i) => (
        <ResultItem
          key={tool.slug}
          tool={tool}
          isHighlighted={highlighted === offset + i}
          onNavigate={onNavigate}
          onHover={() => onHover(offset + i)}
        />
      ))}
    </div>
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [favSlugs, setFavSlugs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  // Give focus back to whatever had it when the palette opened (recorded by the open handlers
  // below, before the search box takes focus), so keyboard users land where they were.
  useEffect(() => {
    if (!open && returnFocusRef.current) {
      returnFocusRef.current.focus?.();
      returnFocusRef.current = null;
    }
  }, [open]);

  // Load persisted data whenever palette opens
  useEffect(() => {
    if (open) {
      setRecentSlugs(getRecentTools());
      setFavSlugs(getFavoriteTools());
      setHighlighted(0);
    }
  }, [open]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!document.querySelector('[role="dialog"][aria-label="Search tools"]')) {
          returnFocusRef.current = document.activeElement as HTMLElement | null;
        }
        setOpen((prev) => {
          if (!prev) setQuery("");
          return !prev;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Custom event from sidebar button
  useEffect(() => {
    const handler = () => {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      setQuery("");
    };
    window.addEventListener("toolninja:openpalette" as keyof WindowEventMap, handler as EventListener);
    return () =>
      window.removeEventListener("toolninja:openpalette" as keyof WindowEventMap, handler as EventListener);
  }, []);

  const navigate = useCallback(
    (slug: string) => {
      returnFocusRef.current = null;
      router.push(`/tools/${slug}`);
      setOpen(false);
      setQuery("");
    },
    [router]
  );

  // Build display lists for empty-state sections
  const isSearching = query.trim().length > 0;
  const searchResults = isSearching ? searchTools(query) : [];

  const favTools = favSlugs
    .map((s) => tools.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];
  const favSet = new Set(favTools.map((t) => t.slug));

  const recentTools = recentSlugs
    .map((s) => tools.find((t) => t.slug === s))
    .filter((t): t is Tool => !!t && !favSet.has(t.slug));
  const recentSet = new Set(recentTools.map((t) => t.slug));

  const defaultTools = tools
    .slice(0, 8)
    .filter((t) => !favSet.has(t.slug) && !recentSet.has(t.slug));

  // Flat list drives keyboard navigation
  const navList: Tool[] = isSearching
    ? searchResults
    : [...favTools, ...recentTools, ...defaultTools];

  const activeTool = navList[highlighted];

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (!open || !activeTool) return;
    document.getElementById(optionId(activeTool.slug))?.scrollIntoView({ block: "nearest" });
  }, [open, activeTool]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // The search box is the only focusable element in the dialog; keep Tab from leaving it.
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, navList.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter" && navList[highlighted]) {
      navigate(navList[highlighted].slug);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-[101] bg-[#111111] border border-[#333333] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-4 border-b border-[#222222]">
          <Search size={14} className="text-[#888888] flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-label="Search tools"
            aria-expanded={navList.length > 0}
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={activeTool ? optionId(activeTool.slug) : undefined}
            placeholder={`Search ${tools.length} tools...`}
            className="flex-1 bg-transparent py-3.5 text-sm text-[#f5f5f5] placeholder-[#777777] focus:outline-none"
          />
          <kbd className="text-xs text-[#999999] bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 rounded flex-shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div id="palette-results" role="listbox" aria-label="Tools" className="max-h-80 overflow-y-auto">
          {isSearching ? (
            searchResults.length === 0 ? (
              <p className="text-center text-sm text-[#999999] py-8" role="status">
                No tools found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="py-1">
                {searchResults.map((tool, i) => (
                  <ResultItem
                    key={tool.slug}
                    tool={tool}
                    isHighlighted={i === highlighted}
                    onNavigate={navigate}
                    onHover={() => setHighlighted(i)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="pb-2">
              <SectionGroup
                label="⭐ Favorites"
                items={favTools}
                highlighted={highlighted}
                offset={0}
                onNavigate={navigate}
                onHover={setHighlighted}
              />
              <SectionGroup
                label="🕐 Recently Used"
                items={recentTools}
                highlighted={highlighted}
                offset={favTools.length}
                onNavigate={navigate}
                onHover={setHighlighted}
              />
              <SectionGroup
                label="All Tools"
                items={defaultTools}
                highlighted={highlighted}
                offset={favTools.length + recentTools.length}
                onNavigate={navigate}
                onHover={setHighlighted}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a1a1a]">
          <span className="text-xs text-[#888888]">↑↓ navigate</span>
          <span className="text-xs text-[#888888]">↵ open</span>
          <span className="text-xs text-[#888888]">esc close</span>
          <span className="ml-auto text-xs text-[#888888]">{tools.length} tools</span>
        </div>
      </div>
    </>
  );
}
