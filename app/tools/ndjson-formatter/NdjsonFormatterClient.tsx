"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { parseNdjson, formatNdjson, ndjsonToJsonArray, jsonArrayToNdjson } from "@/lib/ndjson";

const STORAGE_KEY = "toolninja:ndjson-formatter";

const SAMPLE = `{"event":"login","user":"alice","ts":1709251200}
{"event":"click","user":"alice","target":"checkout","ts":1709251215}
{"event":"logout","user":"alice","ts":1709251340}`;

type Mode = "validate" | "to-array";

export default function NdjsonFormatterClient() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("validate");
  const [pretty, setPretty] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? SAMPLE);
    } catch {
      setInput(SAMPLE);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const lineResults = useMemo(() => (input.trim() ? parseNdjson(input) : []), [input]);
  const errorCount = lineResults.filter((r) => r.error).length;

  const validated = useMemo(() => (mode === "validate" && input.trim() ? formatNdjson(input, pretty) : null), [mode, input, pretty]);
  const asArray = useMemo(() => (mode === "to-array" && input.trim() ? ndjsonToJsonArray(input) : null), [mode, input]);

  const convertArrayBack = () => {
    const result = jsonArrayToNdjson(input);
    if (!result.error) setInput(result.output);
  };

  const output = mode === "validate" ? validated?.output ?? "" : asArray?.output ?? "";

  return (
    <ToolLayout title="NDJSON / JSON Lines Formatter & Validator" description="Validate and pretty-print newline-delimited JSON, or convert to/from a regular JSON array">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setMode("validate")}
            className={`px-3 py-1.5 text-sm transition-colors ${mode === "validate" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Validate / Format
          </button>
          <button
            onClick={() => setMode("to-array")}
            className={`px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "to-array" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Convert to JSON array
          </button>
        </div>
        {mode === "validate" && (
          <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
            <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-[#a855f7]" />
            Pretty-print each line
          </label>
        )}
        <button
          onClick={convertArrayBack}
          className="flex items-center gap-1.5 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors ml-auto"
        >
          <ArrowRightLeft size={11} /> Paste a JSON array instead → convert to NDJSON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">NDJSON input (one JSON value per line)</label>
            {lineResults.length > 0 && (
              <span className={`text-xs ${errorCount > 0 ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                {lineResults.length} line{lineResults.length !== 1 ? "s" : ""}
                {errorCount > 0 ? `, ${errorCount} invalid` : " valid"}
              </span>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              {mode === "validate" ? "Formatted output" : "JSON array"}
            </label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          {asArray && errorCount > 0 ? (
            <div className="h-80 p-3 bg-[#111111] border border-[#ef4444]/40 rounded-[8px] overflow-auto space-y-1.5">
              {lineResults.filter((r) => r.error).map((r) => (
                <div key={r.line} className="flex items-start gap-2 text-xs text-[#ef4444]">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" /> Line {r.line}: {r.error}
                </div>
              ))}
            </div>
          ) : (
            <pre className="h-80 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto whitespace-pre-wrap">
              {output || <span className="text-[#444444] italic">Output will appear here…</span>}
            </pre>
          )}
          {mode === "validate" && errorCount === 0 && lineResults.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-[#22c55e] mt-1.5">
              <CheckCircle2 size={12} /> Every line is valid JSON
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        NDJSON (newline-delimited JSON, also called JSON Lines) encodes one independent JSON value
        per line instead of one big array — the format streaming APIs, log files, and LLM
        token-by-token output commonly use, since a consumer can process each line as it arrives
        without waiting for a closing <code className="text-[#e879f9]">]</code>. Blank lines are skipped.
      </div>
    </ToolLayout>
  );
}
