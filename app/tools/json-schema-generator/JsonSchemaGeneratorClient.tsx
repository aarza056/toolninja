"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle } from "lucide-react";
import { generateJsonSchema } from "@/lib/json-schema";

const STORAGE_KEY = "toolninja:json-schema-generator";

export default function JsonSchemaGeneratorClient() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [includeRequired, setIncludeRequired] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: generateJsonSchema(input, { title: title.trim() || undefined, includeRequired }), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, title, includeRequired]);

  const textareaClass =
    "w-full h-[calc(100vh-360px)] min-h-[350px] p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="JSON Schema Generator"
      description="Infer a JSON Schema (draft-07) from a sample JSON object — instantly"
    >
      {/* Options */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="User"
            className="px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] w-40"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#888888] pb-2">
          <input
            type="checkbox"
            checked={includeRequired}
            onChange={(e) => setIncludeRequired(e.target.checked)}
            className="accent-[#a855f7]"
          />
          Mark all present fields as required
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Sample JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'{\n  "id": 1,\n  "name": "Jane",\n  "active": true,\n  "tags": ["admin", "user"]\n}'}
            spellCheck={false}
            className={`${textareaClass} ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">JSON Schema (draft-07)</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className={`${textareaClass} overflow-auto border-[#222222]`}>
            {output || <span className="text-[#444444] italic">Schema will appear here…</span>}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
