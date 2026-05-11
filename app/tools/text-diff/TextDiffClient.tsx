"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { diffChars, diffWords, diffLines } from "diff";
import { ArrowLeftRight } from "lucide-react";

type DiffMode = "chars" | "words" | "lines";

interface Change {
  value: string;
  added?: boolean;
  removed?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(changes: Change[]): string {
  return changes
    .map((c) => {
      const escaped = escapeHtml(c.value);
      if (c.added) return `<span class="td-add">${escaped}</span>`;
      if (c.removed) return `<span class="td-del">${escaped}</span>`;
      return escaped;
    })
    .join("");
}

export default function TextDiffClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [mode, setMode] = useState<DiffMode>("words");

  const diffResult = useMemo((): Change[] | null => {
    if (!original && !modified) return null;
    if (mode === "chars") return diffChars(original, modified) as Change[];
    if (mode === "words") return diffWords(original, modified) as Change[];
    return diffLines(original, modified) as Change[];
  }, [original, modified, mode]);

  const stats = useMemo(() => {
    if (!diffResult) return null;
    let added = 0;
    let removed = 0;
    for (const c of diffResult) {
      const len = c.value.length;
      if (c.added) added += len;
      else if (c.removed) removed += len;
    }
    return { added, removed };
  }, [diffResult]);

  const isIdentical =
    diffResult !== null &&
    diffResult.every((c) => !c.added && !c.removed);

  const diffHtml = useMemo(() => {
    if (!diffResult) return "";
    return buildHtml(diffResult);
  }, [diffResult]);

  const swap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const modes: { id: DiffMode; label: string }[] = [
    { id: "chars", label: "Character" },
    { id: "words", label: "Word" },
    { id: "lines", label: "Line" },
  ];

  const textareaClass =
    "w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] transition-colors";

  return (
    <ToolLayout
      title="Text Diff"
      description="Inline character, word, and line-level diff between two texts"
    >
      {/* Mode selector */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-[#888888] font-medium">Diff by:</span>
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                m.id === mode
                  ? "bg-[#a855f7] text-white"
                  : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 items-start">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Original</label>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            rows={8}
            placeholder="Paste original text here…"
            className={textareaClass}
            spellCheck={false}
          />
        </div>

        {/* Swap button (centered on md, between textareas) */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 mt-6 z-10 pointer-events-none">
          {/* spacer — real swap button below */}
        </div>

        <div className="flex flex-col gap-1 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Modified</label>
            <button
              onClick={swap}
              title="Swap original and modified"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
            >
              <ArrowLeftRight size={12} /> Swap
            </button>
          </div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            rows={8}
            placeholder="Paste modified text here…"
            className={textareaClass}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Stats bar */}
      {diffResult && !isIdentical && stats && (
        <div className="flex items-center gap-4 mb-4 text-xs font-mono">
          <span>
            <span className="text-[#22c55e] font-semibold">+{stats.added}</span>
            <span className="text-[#888888] ml-1">added</span>
          </span>
          <span>
            <span className="text-[#ef4444] font-semibold">-{stats.removed}</span>
            <span className="text-[#888888] ml-1">removed</span>
          </span>
        </div>
      )}

      {isIdentical && (
        <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-[#22c55e] text-xs font-medium">
          Texts are identical — no differences found.
        </div>
      )}

      {/* Inline diff output */}
      {diffResult && !isIdentical ? (
        <div>
          <p className="text-xs text-[#888888] font-medium mb-2">Inline Diff</p>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        </div>
      ) : !diffResult ? (
        <div className="flex items-center justify-center h-24 text-[#444444] text-sm border border-[#1a1a1a] rounded-[8px]">
          Paste text into both fields to see the diff
        </div>
      ) : null}

      <style>{`
        .td-del {
          background: rgba(239,68,68,0.25);
          color: #ef4444;
          text-decoration: line-through;
          border-radius: 2px;
          padding: 0 1px;
        }
        .td-add {
          background: rgba(34,197,94,0.25);
          color: #22c55e;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </ToolLayout>
  );
}
