"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { gitCommands, gitCategories, GitCategory } from "@/lib/git-commands";
import { AlertTriangle, Clock, X } from "lucide-react";

const RECENT_KEY = "git-cmd-recent";
const MAX_RECENT = 5;

export default function GitCommandGeneratorClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<GitCategory | "All">("All");
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const trackCopy = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }, []);

  const recentCommands = useMemo(
    () => recentIds.map((id) => gitCommands.find((c) => c.id === id)).filter(Boolean) as typeof gitCommands,
    [recentIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gitCommands.filter((cmd) => {
      const matchesCategory = activeCategory === "All" || cmd.category === activeCategory;
      const matchesSearch =
        !q ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.tags.some((t) => t.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <ToolLayout
      title="Git Command Generator"
      description="Search and copy git commands — filter by category, find by keyword."
    >
      <div className="space-y-5">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commands… e.g. rebase, undo, stash, branch"
          className="w-full bg-[#111111] border border-[#222222] rounded-[6px] px-4 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#555555] focus:outline-none focus:border-[#a855f7] transition-colors"
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...gitCategories] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as GitCategory | "All")}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeCategory === cat
                  ? "border-[#a855f7] bg-[#a855f7]/10 text-[#a855f7]"
                  : "border-[#222222] text-[#888888] hover:border-[#a855f7]/50 hover:text-[#f5f5f5]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recent */}
        {recentCommands.length > 0 && !search && activeCategory === "All" && (
          <div className="border border-[#222222] rounded-[8px] p-3 bg-[#0d0d0d]">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs text-[#555555] uppercase tracking-wider font-semibold">
                <Clock size={11} />
                Recently copied
              </span>
              <button onClick={clearRecent} className="text-[#444444] hover:text-[#888888] transition-colors">
                <X size={13} />
              </button>
            </div>
            <div className="space-y-1">
              {recentCommands.map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between gap-3 py-1">
                  <code className="text-xs text-[#a855f7] font-mono truncate">{cmd.command}</code>
                  <CopyButton
                    text={cmd.command}
                    size="sm"
                    className="flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#555555] text-sm">
              No commands match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <CommandCard
                key={cmd.id}
                index={i + 1}
                cmd={cmd}
                onCopy={() => trackCopy(cmd.id)}
              />
            ))
          )}
        </div>

        <p className="text-xs text-[#444444] text-center pt-2">
          {filtered.length} command{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      </div>
    </ToolLayout>
  );
}

interface CommandCardProps {
  index: number;
  cmd: (typeof gitCommands)[number];
  onCopy: () => void;
}

function CommandCard({ index, cmd, onCopy }: CommandCardProps) {
  return (
    <div className="border border-[#222222] rounded-[8px] p-4 bg-[#111111] hover:border-[#333333] transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xs text-[#444444] font-mono mt-0.5 w-5 flex-shrink-0 text-right">
            {index}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-[#f5f5f5]">{cmd.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#222222] text-[#555555] uppercase tracking-wide">
                {cmd.category}
              </span>
              {cmd.warning && (
                <span className="flex items-center gap-1 text-[10px] text-[#f59e0b] border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-1.5 py-0.5 rounded">
                  <AlertTriangle size={10} />
                  Caution
                </span>
              )}
            </div>
            <p className="text-xs text-[#888888] mt-0.5">{cmd.description}</p>
            {cmd.warning && (
              <p className="text-xs text-[#f59e0b]/80 mt-1 flex items-start gap-1">
                <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                {cmd.warning}
              </p>
            )}
            <code className="mt-2 block font-mono text-sm text-[#a855f7] bg-[#0a0a0a] border border-[#1a1a1a] rounded-[4px] px-3 py-1.5 break-all">
              {cmd.command}
            </code>
          </div>
        </div>
        <CopyButton
          text={cmd.command}
          size="sm"
          className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          onAfterCopy={onCopy}
        />
      </div>
    </div>
  );
}
