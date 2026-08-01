"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, Trash2, Download, Bot } from "lucide-react";
import { buildRobotsTxt, AI_CRAWLER_BOTS, type RobotsGroup } from "@/lib/robots-txt";

const STORAGE_KEY = "toolninja:robots-txt-generator";
let groupIdCounter = 2;

const DEFAULT_GROUPS: RobotsGroup[] = [
  { id: 1, userAgent: "*", allow: [], disallow: ["/admin/", "/api/"] },
];

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function RobotsTxtGeneratorClient() {
  const [groups, setGroups] = useState<RobotsGroup[]>(DEFAULT_GROUPS);
  const [sitemaps, setSitemaps] = useState("https://example.com/sitemap.xml");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.sitemaps !== undefined) setSitemaps(parsed.sitemaps);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, sitemaps })); } catch {}
  }, [groups, sitemaps]);

  const addGroup = () => {
    groupIdCounter += 1;
    setGroups((prev) => [...prev, { id: groupIdCounter, userAgent: "*", allow: [], disallow: [] }]);
  };

  const removeGroup = (id: number) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGroup = (id: number, patch: Partial<RobotsGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const addAiBlockGroup = () => {
    groupIdCounter += 1;
    setGroups((prev) => [
      ...prev,
      { id: groupIdCounter, userAgent: AI_CRAWLER_BOTS.join("\n"), allow: [], disallow: ["/"] },
    ]);
  };

  const output = useMemo(
    () => buildRobotsTxt(groups, sitemaps.split("\n")),
    [groups, sitemaps]
  );

  const listToText = (arr: string[]) => arr.join("\n");
  const textToList = (text: string) => text.split("\n");

  return (
    <ToolLayout title="robots.txt Generator" description="Build a robots.txt with per-bot rules, AI crawler blocking, and sitemap links">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: rule builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#888888] font-medium">User-agent groups</label>
            <button
              onClick={addAiBlockGroup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
            >
              <Bot size={12} /> Block AI crawlers
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#555555] font-medium uppercase tracking-wide">
                    User-agent (one per line, * = all bots)
                  </label>
                  <button onClick={() => removeGroup(g.id)} className="text-[#555555] hover:text-[#ef4444] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={g.userAgent}
                  onChange={(e) => updateGroup(g.id, { userAgent: e.target.value })}
                  rows={g.userAgent.split("\n").length > 3 ? 3 : 1}
                  spellCheck={false}
                  className="w-full px-2 py-1.5 text-xs font-mono bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[#555555] font-medium uppercase tracking-wide block mb-1">Disallow</label>
                    <textarea
                      value={listToText(g.disallow)}
                      onChange={(e) => updateGroup(g.id, { disallow: textToList(e.target.value) })}
                      placeholder="/admin/"
                      rows={2}
                      spellCheck={false}
                      className="w-full px-2 py-1.5 text-xs font-mono bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] font-medium uppercase tracking-wide block mb-1">Allow</label>
                    <textarea
                      value={listToText(g.allow)}
                      onChange={(e) => updateGroup(g.id, { allow: textToList(e.target.value) })}
                      placeholder="/public/"
                      rows={2}
                      spellCheck={false}
                      className="w-full px-2 py-1.5 text-xs font-mono bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addGroup}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Plus size={14} /> Add User-agent Group
          </button>

          <div className="mt-4">
            <label className="text-xs text-[#888888] font-medium block mb-1">Sitemap URLs (one per line)</label>
            <textarea
              value={sitemaps}
              onChange={(e) => setSitemaps(e.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>
        </div>

        {/* Right: output */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">robots.txt</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => download("robots.txt", output)}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={12} /> Download
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto h-[calc(100vh-280px)] min-h-[350px]">
            {output}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
