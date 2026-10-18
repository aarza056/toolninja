"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle } from "lucide-react";
import { jsonToZod } from "@/lib/json-to-zod";

const STORAGE_KEY = "toolninja:json-to-zod";

const SAMPLE = `{
  "id": "3f2b8c1e-1d2a-4b5c-9e8f-0a1b2c3d4e5f",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "age": 36,
  "active": true,
  "createdAt": "2026-10-18T09:00:00Z",
  "roles": ["admin", "editor"],
  "orders": [
    { "sku": "A-100", "qty": 1 },
    { "sku": "B-200", "qty": 2, "note": null }
  ]
}`;

export default function JsonToZodClient() {
  const [input, setInput] = useState(SAMPLE);
  const [schemaName, setSchemaName] = useState("user");
  const [detectFormats, setDetectFormats] = useState(true);
  const [exportType, setExportType] = useState(true);

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

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: jsonToZod(input, { schemaName, detectFormats, exportType }), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, schemaName, detectFormats, exportType]);

  return (
    <ToolLayout
      title="JSON to Zod Schema Generator"
      description="Paste sample JSON and get a ready-to-use Zod schema plus its inferred TypeScript type"
    >
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs text-[#888888]">
          Schema name
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            spellCheck={false}
            className="w-36 px-2.5 py-1.5 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
          <input type="checkbox" checked={detectFormats} onChange={(e) => setDetectFormats(e.target.checked)} className="accent-[#a855f7]" />
          Detect email / URL / UUID / datetime
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
          <input type="checkbox" checked={exportType} onChange={(e) => setExportType(e.target.checked)} className="accent-[#a855f7]" />
          Export z.infer type
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Sample JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "name": "Ada"}'
            spellCheck={false}
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Zod schema</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className="flex-1 p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre">
            {output || <span className="text-[#444444] italic">Schema will appear here…</span>}
          </pre>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#555555] leading-relaxed">
        Arrays of objects are merged: a key missing from some items becomes <code className="text-[#888888]">.optional()</code>, and a key
        that is sometimes <code className="text-[#888888]">null</code> becomes <code className="text-[#888888]">.nullable()</code>. The more
        representative your sample, the more accurate the schema.
      </p>
    </ToolLayout>
  );
}
