"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { processLines, shuffleLines, reverseLines, type SortMode } from "@/lib/list-tools";
import { Shuffle, FlipVertical2 } from "lucide-react";

const STORAGE_KEY = "toolninja:list-sorter";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "none", label: "No sort" },
  { value: "alpha", label: "A → Z" },
  { value: "alpha-desc", label: "Z → A" },
  { value: "numeric", label: "Numeric ↑" },
  { value: "numeric-desc", label: "Numeric ↓" },
  { value: "length", label: "Shortest first" },
  { value: "length-desc", label: "Longest first" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#cccccc] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-[#a855f7]"
      />
      {label}
    </label>
  );
}

export default function ListSorterClient() {
  const [input, setInput] = useState("");
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [dedupe, setDedupe] = useState(false);
  const [dedupeCaseSensitive, setDedupeCaseSensitive] = useState(true);
  const [sort, setSort] = useState<SortMode>("none");
  const [numbered, setNumbered] = useState(false);

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

  const outputLines = useMemo(
    () => processLines(input, { trim, removeEmpty, dedupe, dedupeCaseSensitive, sort, numbered }),
    [input, trim, removeEmpty, dedupe, dedupeCaseSensitive, sort, numbered]
  );
  const output = outputLines.join("\n");

  const inputLineCount = input === "" ? 0 : input.split("\n").length;
  const outputLineCount = output === "" ? 0 : outputLines.length;
  const removedCount = Math.max(0, inputLineCount - outputLineCount);

  const applyShuffle = useCallback(() => {
    setInput(shuffleLines(input.split("\n")).join("\n"));
  }, [input]);

  const applyReverse = useCallback(() => {
    setInput(reverseLines(input.split("\n")).join("\n"));
  }, [input]);

  const textareaClass =
    "w-full h-72 p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="List Sorter & Deduplicator"
      description="Sort, dedupe, shuffle, and clean up lists of text lines"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
        <Toggle checked={trim} onChange={setTrim} label="Trim whitespace" />
        <Toggle checked={removeEmpty} onChange={setRemoveEmpty} label="Remove empty lines" />
        <Toggle checked={dedupe} onChange={setDedupe} label="Remove duplicates" />
        {dedupe && (
          <Toggle checked={dedupeCaseSensitive} onChange={setDedupeCaseSensitive} label="Case-sensitive" />
        )}
        <Toggle checked={numbered} onChange={setNumbered} label="Number lines" />

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-[#888888]">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-2 py-1 text-sm bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={applyShuffle}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Shuffle size={12} /> Shuffle input
        </button>
        <button
          onClick={applyReverse}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <FlipVertical2 size={12} /> Reverse input
        </button>
        <span className="text-xs text-[#555555] ml-auto">
          {inputLineCount} line{inputLineCount !== 1 ? "s" : ""} in
          {removedCount > 0 && <> → {outputLineCount} out ({removedCount} removed)</>}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"banana\napple\napple\ncherry"}
            spellCheck={false}
            className={textareaClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Output</label>
            <CopyButton text={output} size="sm" />
          </div>
          <pre className={`${textareaClass} overflow-auto whitespace-pre-wrap`}>{output}</pre>
        </div>
      </div>
    </ToolLayout>
  );
}
