"use client";

import { useState, useMemo, useCallback, useRef, type ChangeEvent } from "react";
import ToolLayout from "@/components/ToolLayout";
import { diffLines, diffChars } from "diff";
import { Upload, Columns, List, Trash2 } from "lucide-react";

type ViewMode = "split" | "unified";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function splitLines(s: string): string[] {
  const lines = s.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function charDiff(a: string, b: string): { lHtml: string; rHtml: string } {
  const parts = diffChars(a, b);
  let lHtml = "",
    rHtml = "";
  for (const p of parts) {
    const t = esc(p.value);
    if (p.removed) lHtml += `<mark class="dc-del">${t}</mark>`;
    else if (p.added) rHtml += `<mark class="dc-add">${t}</mark>`;
    else {
      lHtml += t;
      rHtml += t;
    }
  }
  return { lHtml, rHtml };
}

interface SplitRow {
  lNum: number | null;
  rNum: number | null;
  lHtml: string;
  rHtml: string;
  rowType: "ctx" | "del" | "add" | "chg";
}

function buildSplit(original: string, modified: string): SplitRow[] {
  const diff = diffLines(original, modified);
  const rows: SplitRow[] = [];
  let ln = 1,
    rn = 1,
    i = 0;

  while (i < diff.length) {
    const chunk = diff[i];
    if (!chunk.added && !chunk.removed) {
      for (const line of splitLines(chunk.value))
        rows.push({ lNum: ln++, rNum: rn++, lHtml: esc(line), rHtml: esc(line), rowType: "ctx" });
      i++;
    } else if (chunk.removed && i + 1 < diff.length && diff[i + 1].added) {
      const lLines = splitLines(chunk.value);
      const rLines = splitLines(diff[i + 1].value);
      const max = Math.max(lLines.length, rLines.length);
      for (let j = 0; j < max; j++) {
        const l = lLines[j] ?? null;
        const r = rLines[j] ?? null;
        if (l !== null && r !== null) {
          const { lHtml, rHtml } = charDiff(l, r);
          rows.push({ lNum: ln++, rNum: rn++, lHtml, rHtml, rowType: "chg" });
        } else if (l !== null) {
          rows.push({ lNum: ln++, rNum: null, lHtml: esc(l), rHtml: "", rowType: "del" });
        } else {
          rows.push({ lNum: null, rNum: rn++, lHtml: "", rHtml: esc(r!), rowType: "add" });
        }
      }
      i += 2;
    } else if (chunk.removed) {
      for (const line of splitLines(chunk.value))
        rows.push({ lNum: ln++, rNum: null, lHtml: esc(line), rHtml: "", rowType: "del" });
      i++;
    } else {
      for (const line of splitLines(chunk.value))
        rows.push({ lNum: null, rNum: rn++, lHtml: "", rHtml: esc(line), rowType: "add" });
      i++;
    }
  }
  return rows;
}

interface UnifiedLine {
  prefix: "+" | "-" | " ";
  html: string;
  type: "add" | "del" | "ctx";
}

function buildUnified(original: string, modified: string): UnifiedLine[] {
  const diff = diffLines(original, modified);
  const lines: UnifiedLine[] = [];
  let i = 0;

  while (i < diff.length) {
    const chunk = diff[i];
    if (!chunk.added && !chunk.removed) {
      for (const line of splitLines(chunk.value))
        lines.push({ prefix: " ", html: esc(line), type: "ctx" });
      i++;
    } else if (chunk.removed && i + 1 < diff.length && diff[i + 1].added) {
      const lLines = splitLines(chunk.value);
      const rLines = splitLines(diff[i + 1].value);
      for (let j = 0; j < lLines.length; j++) {
        const r = rLines[j];
        const html = r !== undefined ? charDiff(lLines[j], r).lHtml : esc(lLines[j]);
        lines.push({ prefix: "-", html, type: "del" });
      }
      for (let j = 0; j < rLines.length; j++) {
        const l = lLines[j];
        const html = l !== undefined ? charDiff(l, rLines[j]).rHtml : esc(rLines[j]);
        lines.push({ prefix: "+", html, type: "add" });
      }
      i += 2;
    } else if (chunk.removed) {
      for (const line of splitLines(chunk.value))
        lines.push({ prefix: "-", html: esc(line), type: "del" });
      i++;
    } else {
      for (const line of splitLines(chunk.value))
        lines.push({ prefix: "+", html: esc(line), type: "add" });
      i++;
    }
  }
  return lines;
}

export default function DiffCheckerClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [view, setView] = useState<ViewMode>("split");
  const leftRef = useRef<HTMLInputElement>(null);
  const rightRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (side: "left" | "right") => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (side === "left") setOriginal(text);
        else setModified(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const hasBoth = original.length > 0 && modified.length > 0;

  const splitRows = useMemo(
    () => (hasBoth ? buildSplit(original, modified) : []),
    [original, modified, hasBoth]
  );

  const unifiedLines = useMemo(
    () => (hasBoth ? buildUnified(original, modified) : []),
    [original, modified, hasBoth]
  );

  const addedLines = splitRows.filter((r) => r.rowType === "add" || r.rowType === "chg").length;
  const removedLines = splitRows.filter((r) => r.rowType === "del" || r.rowType === "chg").length;
  const identical = hasBoth && addedLines === 0 && removedLines === 0;

  return (
    <ToolLayout
      title="Diff Checker"
      description="Compare two texts — split and unified view with character-level highlighting"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setView("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "split" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <Columns size={13} /> Split
          </button>
          <button
            onClick={() => setView("unified")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${view === "unified" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <List size={13} /> Unified
          </button>
        </div>

        <button
          onClick={() => { setOriginal(""); setModified(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Trash2 size={13} /> Clear
        </button>

        {hasBoth && !identical && (
          <div className="flex items-center gap-3 ml-auto text-sm">
            <span className="text-[#22c55e] font-mono">+{addedLines}</span>
            <span className="text-[#ef4444] font-mono">−{removedLines}</span>
          </div>
        )}
        {identical && <span className="ml-auto text-sm text-[#22c55e]">Identical ✓</span>}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {(["left", "right"] as const).map((side) => {
          const isLeft = side === "left";
          const value = isLeft ? original : modified;
          const setValue = isLeft ? setOriginal : setModified;
          const fileRef = isLeft ? leftRef : rightRef;
          return (
            <div key={side} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#888888] font-medium">
                  {isLeft ? "Original" : "Modified"}
                </label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Upload size={11} /> Upload file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={readFile(side)}
                />
              </div>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Paste ${isLeft ? "original" : "modified"} text or upload a file…`}
                rows={8}
                className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#333333]"
                spellCheck={false}
              />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!hasBoth && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
          {!original && !modified
            ? "Paste text or upload files in both panels to compare"
            : "Add the other text to see the diff"}
        </div>
      )}

      {/* Identical */}
      {identical && (
        <div className="p-6 text-center text-[#22c55e] border border-[#22c55e]/20 bg-[#22c55e]/5 rounded-[8px]">
          No differences — texts are identical
        </div>
      )}

      {/* Split view */}
      {hasBoth && !identical && view === "split" && (
        <div className="border border-[#222222] rounded-[8px] overflow-auto font-mono text-xs">
          <div className="grid grid-cols-2 border-b border-[#222222] sticky top-0 bg-[#0a0a0a]">
            <div className="px-3 py-2 text-[#555555] font-sans font-medium border-r border-[#222222]">Original</div>
            <div className="px-3 py-2 text-[#555555] font-sans font-medium">Modified</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r border-[#222222]">
              {splitRows.map((row, i) => {
                const active = row.rowType === "del" || row.rowType === "chg";
                const empty = row.rowType === "add";
                return (
                  <div key={i} className={`flex min-h-[22px] items-start ${active ? "bg-[#ef4444]/10" : empty ? "bg-[#0d0d0d]" : ""}`}>
                    <span className="w-10 shrink-0 px-2 py-0.5 text-right text-[#333333] select-none border-r border-[#1a1a1a]">
                      {row.lNum ?? ""}
                    </span>
                    {empty ? (
                      <span className="px-2 py-0.5 text-[#1e1e1e] select-none">·</span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 whitespace-pre-wrap break-all leading-[22px] ${active ? "text-[#ef4444]" : "text-[#888888]"}`}
                        dangerouslySetInnerHTML={{ __html: row.lHtml }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              {splitRows.map((row, i) => {
                const active = row.rowType === "add" || row.rowType === "chg";
                const empty = row.rowType === "del";
                return (
                  <div key={i} className={`flex min-h-[22px] items-start ${active ? "bg-[#22c55e]/10" : empty ? "bg-[#0d0d0d]" : ""}`}>
                    <span className="w-10 shrink-0 px-2 py-0.5 text-right text-[#333333] select-none border-r border-[#1a1a1a]">
                      {row.rNum ?? ""}
                    </span>
                    {empty ? (
                      <span className="px-2 py-0.5 text-[#1e1e1e] select-none">·</span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 whitespace-pre-wrap break-all leading-[22px] ${active ? "text-[#22c55e]" : "text-[#888888]"}`}
                        dangerouslySetInnerHTML={{ __html: row.rHtml }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unified view */}
      {hasBoth && !identical && view === "unified" && (
        <div className="border border-[#222222] rounded-[8px] overflow-auto">
          {unifiedLines.map((line, i) => (
            <div
              key={i}
              className={`flex items-start px-3 py-0.5 font-mono text-xs ${
                line.type === "add"
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : line.type === "del"
                  ? "bg-[#ef4444]/10 text-[#ef4444]"
                  : "text-[#666666]"
              }`}
            >
              <span className="w-4 shrink-0 select-none">{line.prefix}</span>
              <span
                className="whitespace-pre-wrap break-all"
                dangerouslySetInnerHTML={{ __html: line.html }}
              />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .dc-del { background: rgba(239,68,68,0.35); border-radius: 2px; padding: 0 1px; }
        .dc-add { background: rgba(34,197,94,0.35); border-radius: 2px; padding: 0 1px; }
      `}</style>
    </ToolLayout>
  );
}
