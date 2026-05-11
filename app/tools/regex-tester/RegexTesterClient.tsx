"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertCircle, Table2, Repeat2 } from "lucide-react";

const STORAGE_KEY = "toolninja:regex-tester";

type Mode = "match" | "replace";

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [mode, setMode] = useState<Mode>("match");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.pattern) setPattern(d.pattern);
        if (d.testString) setTestString(d.testString);
        if (d.flags) setFlags(d.flags);
        if (d.replaceWith) setReplaceWith(d.replaceWith);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pattern, testString, flags, replaceWith }));
    } catch {}
  }, [pattern, testString, flags, replaceWith]);

  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("");

  const result = useMemo(() => {
    if (!pattern) return { highlighted: escHtml(testString), matches: [] as RegExpMatchArray[], replaceResult: "", error: "" };
    try {
      const gFlagStr = flagStr.includes("g") ? flagStr : flagStr + "g";
      const regex = new RegExp(pattern, gFlagStr);
      const allMatches = Array.from(testString.matchAll(regex));

      let highlighted = "";
      let lastIndex = 0;
      for (const m of allMatches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        highlighted += escHtml(testString.slice(lastIndex, start));
        highlighted += `<mark class="regex-match">${escHtml(m[0])}</mark>`;
        lastIndex = end;
      }
      highlighted += escHtml(testString.slice(lastIndex));

      const replaceResult = testString.replace(new RegExp(pattern, gFlagStr), replaceWith);
      return { highlighted, matches: allMatches, replaceResult, error: "" };
    } catch (e: unknown) {
      return {
        highlighted: escHtml(testString),
        matches: [] as RegExpMatchArray[],
        replaceResult: "",
        error: e instanceof Error ? e.message : "Invalid regex",
      };
    }
  }, [pattern, testString, flagStr, replaceWith]);

  const { highlighted, matches, replaceResult, error } = result;
  const hasResults = !!(pattern && testString && !error);

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions with live highlighting, match table, and replace mode"
    >
      {/* Pattern + Flags */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#888888] font-mono text-sm">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className={`flex-1 px-3 py-2 font-mono text-sm bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
            spellCheck={false}
          />
          <span className="text-[#888888] font-mono text-sm">/{flagStr}</span>
        </div>
        <div className="flex gap-4">
          {(["g", "i", "m", "s"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm text-[#888888] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flags[f]}
                onChange={(e) => setFlags((prev) => ({ ...prev, [f]: e.target.checked }))}
                className="accent-[#a855f7]"
              />
              <span className="font-mono">{f}</span>
              <span className="text-xs text-[#555555]">
                {f === "g" ? "global" : f === "i" ? "insensitive" : f === "m" ? "multiline" : "dotAll"}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Test string */}
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">Test String</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter test string..."
          rows={6}
          className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          spellCheck={false}
        />
      </div>

      {/* Match preview */}
      {pattern && testString && (
        <div className="mb-4">
          <label className="text-xs text-[#888888] font-medium block mb-1">Match Preview</label>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}

      {/* Mode tabs + match count */}
      {hasResults && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
            <button
              onClick={() => setMode("match")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${mode === "match" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              <Table2 size={13} /> Match Table
            </button>
            <button
              onClick={() => setMode("replace")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "replace" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              <Repeat2 size={13} /> Replace
            </button>
          </div>
          <span className="text-sm text-[#888888]">
            {matches.length === 0 ? (
              "No matches"
            ) : (
              <span>
                Found <span className="text-[#a855f7] font-semibold">{matches.length}</span>{" "}
                {matches.length === 1 ? "match" : "matches"}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Match table */}
      {mode === "match" && hasResults && matches.length > 0 && (
        <div className="border border-[#222222] rounded-[8px] overflow-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0d0d0d]">
                <th className="px-3 py-2 text-left text-[#555555] font-medium">#</th>
                <th className="px-3 py-2 text-left text-[#555555] font-medium">Index</th>
                <th className="px-3 py-2 text-left text-[#555555] font-medium">Len</th>
                <th className="px-3 py-2 text-left text-[#555555] font-medium">Match</th>
                <th className="px-3 py-2 text-left text-[#555555] font-medium">Groups</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const named = m.groups ? Object.entries(m.groups) : [];
                const numbered = m.slice(1);
                return (
                  <tr key={i} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111111]">
                    <td className="px-3 py-2 text-[#555555]">{i + 1}</td>
                    <td className="px-3 py-2 text-[#888888]">{m.index}</td>
                    <td className="px-3 py-2 text-[#888888]">{m[0].length}</td>
                    <td className="px-3 py-2 text-[#fbbf24] max-w-[200px] truncate">{m[0]}</td>
                    <td className="px-3 py-2 text-[#888888]">
                      {named.length > 0 ? (
                        <span className="flex flex-wrap gap-2">
                          {named.map(([name, val]) => (
                            <span key={name}>
                              <span className="text-[#a855f7]">{name}</span>={val ?? "—"}
                            </span>
                          ))}
                        </span>
                      ) : numbered.filter(Boolean).length > 0 ? (
                        <span className="flex flex-wrap gap-2">
                          {numbered.map((g, gi) => (
                            <span key={gi}>
                              <span className="text-[#a855f7]">${gi + 1}</span>={g ?? "—"}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-[#333333]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No matches state */}
      {mode === "match" && hasResults && matches.length === 0 && (
        <div className="p-6 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
          No matches found
        </div>
      )}

      {/* Replace mode */}
      {mode === "replace" && hasResults && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">
              Replacement{" "}
              <span className="text-[#555555]">
                ($&amp;, $1, $2, ${"<"}name{">"} supported)
              </span>
            </label>
            <input
              type="text"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="e.g. [$&] or $1-$2"
              className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Result</label>
            <div className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] whitespace-pre-wrap break-all text-[#22c55e] min-h-[60px]">
              {replaceResult || <span className="text-[#333333]">Result will appear here…</span>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .regex-match { background-color: rgba(251,191,36,0.3); color: #fbbf24; border-radius: 2px; padding: 0 1px; }
      `}</style>
    </ToolLayout>
  );
}
