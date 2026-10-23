"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateUnifiedDiff, applyUnifiedDiff } from "@/lib/diff-patch";

const STORAGE_KEY = "toolninja:patch-generator";
const APPLY_STORAGE_KEY = "toolninja:patch-generator-apply";

type Mode = "generate" | "apply";

export default function PatchGeneratorClient() {
  const [mode, setMode] = useState<Mode>("generate");
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [oldFileName, setOldFileName] = useState("a/file.txt");
  const [newFileName, setNewFileName] = useState("b/file.txt");
  const [context, setContext] = useState(3);

  const [applyOriginal, setApplyOriginal] = useState("");
  const [applyPatch, setApplyPatch] = useState("");

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
      const savedApply = localStorage.getItem(APPLY_STORAGE_KEY);
      if (savedApply) {
        const parsed = JSON.parse(savedApply);
        setApplyOriginal(parsed.applyOriginal ?? "");
        setApplyPatch(parsed.applyPatch ?? "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ oldText, newText, oldFileName, newFileName }));
    } catch {}
  }, [oldText, newText, oldFileName, newFileName]);

  useEffect(() => {
    try {
      localStorage.setItem(APPLY_STORAGE_KEY, JSON.stringify({ applyOriginal, applyPatch }));
    } catch {}
  }, [applyOriginal, applyPatch]);

  const result = useMemo(
    () => generateUnifiedDiff(oldText, newText, oldFileName, newFileName, context),
    [oldText, newText, oldFileName, newFileName, context]
  );

  const applyResult = useMemo(() => {
    if (!applyOriginal.trim() || !applyPatch.trim()) return null;
    return applyUnifiedDiff(applyOriginal, applyPatch);
  }, [applyOriginal, applyPatch]);

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
      description="Generate a .patch file from two texts, or apply an existing patch — usable with git apply or patch"
    >
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden w-fit mb-4">
        <button
          onClick={() => setMode("generate")}
          className={`px-4 py-1.5 text-sm transition-colors ${mode === "generate" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Generate
        </button>
        <button
          onClick={() => setMode("apply")}
          className={`px-4 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "apply" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Apply
        </button>
      </div>

      {mode === "apply" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px] mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#888888] font-medium">Original text</label>
              <textarea
                value={applyOriginal}
                onChange={(e) => setApplyOriginal(e.target.value)}
                placeholder="Paste the text the patch was generated against…"
                spellCheck={false}
                className="flex-1 w-full p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#888888] font-medium">Patch (unified diff)</label>
              <textarea
                value={applyPatch}
                onChange={(e) => setApplyPatch(e.target.value)}
                placeholder={"--- a/file.txt\n+++ b/file.txt\n@@ -1,3 +1,3 @@\n..."}
                spellCheck={false}
                className="flex-1 w-full p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>

          {applyResult?.error && (
            <div className="flex items-start gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-sm text-[#ef4444]">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {applyResult.error}
            </div>
          )}

          {applyResult && !applyResult.error && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium">
                  <CheckCircle2 size={12} /> Patch applied cleanly
                </label>
                <CopyButton text={applyResult.result} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto max-h-[320px] whitespace-pre-wrap">
                {applyResult.result}
              </pre>
            </div>
          )}

          {!applyOriginal && !applyPatch && (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
              Paste the original text and a unified diff to apply it
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </ToolLayout>
  );
}
