"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle } from "lucide-react";
import { jsonToMarkdownTable } from "@/lib/json-to-markdown-table";

const STORAGE_KEY = "toolninja:json-to-markdown-table";

const SAMPLE = `[
  { "tool": "JSON Formatter", "category": "Format", "browserOnly": true },
  { "tool": "Base58 Encoder", "category": "Encode", "browserOnly": true },
  { "tool": "Patch Generator", "category": "Test", "browserOnly": true }
]`;

export default function JsonToMarkdownTableClient() {
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? SAMPLE);
    } catch {
      setInput(SAMPLE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: "" };
    try {
      return { result: jsonToMarkdownTable(input), error: "" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Conversion failed" };
    }
  }, [input]);

  return (
    <ToolLayout
      title="JSON to Markdown Table"
      description="Convert a JSON array of objects into a ready-to-paste Markdown table"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "420px" }}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">JSON array</label>
            <button onClick={() => setInput(SAMPLE)} className="text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
              Load example
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{ "name": "Alice", "age": 30 }, ...]'
            spellCheck={false}
            className="flex-1 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
            style={{ minHeight: "380px" }}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Markdown table</label>
            {result && <CopyButton text={result.markdown} size="sm" />}
          </div>
          <pre
            className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all"
            style={{ minHeight: "180px" }}
          >
            {result ? result.markdown : <span className="text-[#444444] italic">Markdown table will appear here…</span>}
          </pre>

          {result && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">Preview</label>
              <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1a1a1a]">
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-[#f5f5f5] font-medium border-b border-[#222222] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-[#1a1a1a] last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-[#888888] whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#555555] mt-2">{result.rowCount} row{result.rowCount !== 1 ? "s" : ""} · {result.columns.length} column{result.columns.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
