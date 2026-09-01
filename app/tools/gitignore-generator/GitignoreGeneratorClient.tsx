"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, Search, CheckCircle2, XCircle } from "lucide-react";
import { gitignoreTemplates, buildGitignore, type GitignoreTemplate } from "@/lib/gitignore-templates";
import { testPathAgainstGitignore } from "@/lib/gitignore-tester";

const STORAGE_KEY = "toolninja:gitignore-generator";
const CATEGORIES: GitignoreTemplate["category"][] = ["Language", "Framework", "Tool", "Editor", "OS"];

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function GitignoreGeneratorClient() {
  const [selected, setSelected] = useState<string[]>(["node", "vscode", "macos"]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelected(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); } catch {}
  }, [selected]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const output = useMemo(() => buildGitignore(selected), [selected]);
  const [testPath, setTestPath] = useState("");
  const pathTestResult = useMemo(
    () => (testPath.trim() && output ? testPathAgainstGitignore(testPath, output) : null),
    [testPath, output]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gitignoreTemplates;
    return gitignoreTemplates.filter((t) => t.label.toLowerCase().includes(q));
  }, [search]);

  return (
    <ToolLayout title=".gitignore Generator" description="Pick your stack and get a ready-to-use .gitignore instantly">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: template picker */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stacks, editors, OS…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          {CATEGORIES.map((cat) => {
            const items = filtered.filter((t) => t.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-5">
                <h3 className="text-xs font-semibold text-[#555555] uppercase tracking-wider mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((t) => {
                    const active = selected.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggle(t.id)}
                        className={`px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
                          active
                            ? "bg-[#a855f7] border-[#a855f7] text-white"
                            : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5] hover:border-[#333333]"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: output */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              {selected.length === 0 ? ".gitignore" : `.gitignore — ${selected.length} selected`}
            </label>
            <div className="flex items-center gap-2">
              {output && (
                <button
                  onClick={() => download(".gitignore", output)}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          {output ? (
            <>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto h-[calc(100vh-420px)] min-h-[220px]">
                {output}
              </pre>

              <div className="mt-4">
                <label className="text-xs text-[#888888] font-medium block mb-1">Test a path against these rules</label>
                <input
                  type="text"
                  value={testPath}
                  onChange={(e) => setTestPath(e.target.value)}
                  placeholder="e.g. node_modules/react/index.js or src/build/output.js"
                  spellCheck={false}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
                {pathTestResult && (
                  <div className={`flex items-start gap-2 mt-2 p-2.5 rounded-[6px] text-xs ${
                    pathTestResult.ignored
                      ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
                      : "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"
                  }`}>
                    {pathTestResult.ignored ? (
                      <XCircle size={14} className="shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    )}
                    <span>
                      {pathTestResult.ignored ? "Ignored" : "Not ignored"}
                      {pathTestResult.matchedRule && (
                        <> — matched rule <code className="font-mono">{pathTestResult.matchedRule}</code></>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
              Select at least one stack, editor, or OS to generate a .gitignore
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
