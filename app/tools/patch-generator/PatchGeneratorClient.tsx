"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, AlertTriangle } from "lucide-react";
import { generateUnifiedDiff } from "@/lib/diff-patch";

const STORAGE_KEY = "toolninja:patch-generator";

export default function PatchGeneratorClient() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [oldFileName, setOldFileName] = useState("a/file.txt");
  const [newFileName, setNewFileName] = useState("b/file.txt");
  const [context, setContext] = useState(3);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setOldText(parsed.oldText ?? "");
        setNewText(parsed.newText ?? "");
        setOldFileName(parsed.oldFileName ?? "a/file.txt");
        setNewFileName(parsed.newFileName ?? "b/file.txt");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ oldText, newText, oldFileName, newFileName }));
    } catch {}
  }, [oldText, newText, oldFileName, newFileName]);

  const result = useMemo(
    () => generateUnifiedDiff(oldText, newText, oldFileName, newFileName, context),
    [oldText, newText, oldFileName, newFileName, context]
  );

  const downloadPatch = () => {
    if (!result.patch) return;
    const blob = new Blob([result.patch], { type: "text/x-patch" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "changes.patch";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout
      title="Unified Diff / Patch Generator"
      description="Generate a real, downloadable .patch file from two texts — usable with git apply or patch"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          value={oldFileName}
          onChange={(e) => setOldFileName(e.target.value)}
          placeholder="a/file.txt"
          className="px-3 py-1.5 text-xs font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="b/file.txt"
          className="px-3 py-1.5 text-xs font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px] mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Original</label>
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="Paste the original text…"
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Modified</label>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Paste the modified text…"
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs text-[#888888] font-medium">Context lines</label>
        <input
          type="range"
          min={0}
          max={8}
          value={context}
          onChange={(e) => setContext(Number(e.target.value))}
          className="w-32 accent-[#a855f7]"
        />
        <span className="text-xs font-mono text-[#a855f7]">{context}</span>
      </div>

      {result.tooLarge && (
        <div className="flex items-center gap-2 p-3 bg-[#f97316]/10 border border-[#f97316]/30 rounded-[8px] text-sm text-[#f97316]">
          <AlertTriangle size={14} /> One of the texts is too large to diff in the browser (4,000+ lines) — try a smaller excerpt.
        </div>
      )}

      {!result.tooLarge && result.identical && oldText && newText && (
        <div className="p-3 bg-[#111111] border border-dashed border-[#222222] rounded-[8px] text-sm text-[#555555] text-center">
          No differences — the two texts are identical.
        </div>
      )}

      {!result.tooLarge && result.patch && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Unified diff</label>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPatch}
                className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
              >
                <Download size={12} /> Download .patch
              </button>
              <CopyButton text={result.patch} size="sm" />
            </div>
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto max-h-[400px]">
            {result.patch.split("\n").map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("+") && !line.startsWith("+++")
                    ? "text-[#22c55e]"
                    : line.startsWith("-") && !line.startsWith("---")
                      ? "text-[#ef4444]"
                      : line.startsWith("@@")
                        ? "text-[#3b82f6]"
                        : line.startsWith("---") || line.startsWith("+++")
                          ? "text-[#a855f7]"
                          : "text-[#888888]"
                }
              >
                {line || " "}
              </div>
            ))}
          </pre>
        </div>
      )}

      {!oldText && !newText && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
          Paste an original and a modified version to generate a patch
        </div>
      )}
    </ToolLayout>
  );
}
