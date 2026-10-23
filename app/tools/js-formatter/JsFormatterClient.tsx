"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Code2, Minimize2, Trash2, AlertCircle } from "lucide-react";
import { formatJs, minifyJs, type JsParser } from "@/lib/js-format";

const STORAGE_KEY = "toolninja:js-formatter";

type Mode = "format" | "minify";

export default function JsFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [parser, setParser] = useState<JsParser>("babel");
  const [semi, setSemi] = useState(true);
  const [singleQuote, setSingleQuote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after: number } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const run = useCallback(async () => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      setSizeInfo(null);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "format") {
        const result = await formatJs(input, { parser, semi, singleQuote, tabWidth: 2 });
        setOutput(result);
        setSizeInfo(null);
      } else {
        const result = await minifyJs(input);
        setOutput(result.code);
        setSizeInfo({ before: result.originalSize, after: result.minifiedSize });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process this code");
      setOutput("");
      setSizeInfo(null);
    } finally {
      setBusy(false);
    }
  }, [input, mode, parser, semi, singleQuote]);

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
    setSizeInfo(null);
  };

  const reduction = sizeInfo && sizeInfo.before > 0 ? Math.round((1 - sizeInfo.after / sizeInfo.before) * 100) : null;

  return (
    <ToolLayout
      title="JavaScript / TypeScript Formatter & Minifier"
      description="Beautify or minify JS and TS code instantly — powered by Prettier and Terser, entirely in your browser"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setMode("format")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${mode === "format" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <Code2 size={13} /> Format
          </button>
          <button
            onClick={() => setMode("minify")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "minify" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <Minimize2 size={13} /> Minify
          </button>
        </div>

        {mode === "format" && (
          <>
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              <button
                onClick={() => setParser("babel")}
                className={`px-3 py-1.5 text-xs transition-colors ${parser === "babel" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setParser("typescript")}
                className={`px-3 py-1.5 text-xs border-l border-[#222222] transition-colors ${parser === "typescript" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                TypeScript
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
              <input type="checkbox" checked={semi} onChange={(e) => setSemi(e.target.checked)} className="accent-[#a855f7]" />
              Semicolons
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
              <input type="checkbox" checked={singleQuote} onChange={(e) => setSingleQuote(e.target.checked)} className="accent-[#a855f7]" />
              Single quotes
            </label>
          </>
        )}

        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
        >
          {busy ? "Working…" : mode === "format" ? "Format" : "Minify"}
        </button>

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {mode === "minify" && (
        <p className="text-xs text-[#555555] mb-4">
          Minify expects plain JavaScript (Terser doesn&apos;t strip TypeScript types) — format TypeScript to JS first, or paste JS directly.
        </p>
      )}

      {reduction !== null && sizeInfo && (
        <div className="flex items-center gap-3 mb-4 text-xs text-[#22c55e]">
          <span>{sizeInfo.before.toLocaleString()} bytes → {sizeInfo.after.toLocaleString()} bytes</span>
          <span className="px-2 py-0.5 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full">-{reduction}%</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-320px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JavaScript or TypeScript here..."
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-start gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} className="shrink-0 mt-0.5" /> <span className="break-all">{error}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Output</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here…"
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      </div>
    </ToolLayout>
  );
}
