"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle } from "lucide-react";
import { generateJsonSchema, validateAgainstSchema } from "@/lib/json-schema";

const STORAGE_KEY = "toolninja:json-schema-generator";
const VALIDATE_STORAGE_KEY = "toolninja:json-schema-validator";

type Mode = "generate" | "validate";

export default function JsonSchemaGeneratorClient() {
  const [mode, setMode] = useState<Mode>("generate");
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [includeRequired, setIncludeRequired] = useState(true);
  const [schemaInput, setSchemaInput] = useState("");
  const [dataInput, setDataInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
      const savedValidate = localStorage.getItem(VALIDATE_STORAGE_KEY);
      if (savedValidate) {
        const parsed = JSON.parse(savedValidate);
        if (parsed.schemaInput) setSchemaInput(parsed.schemaInput);
        if (parsed.dataInput) setDataInput(parsed.dataInput);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  useEffect(() => {
    try { localStorage.setItem(VALIDATE_STORAGE_KEY, JSON.stringify({ schemaInput, dataInput })); } catch {}
  }, [schemaInput, dataInput]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: generateJsonSchema(input, { title: title.trim() || undefined, includeRequired }), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, title, includeRequired]);

  const validation = useMemo(() => {
    if (!schemaInput.trim() || !dataInput.trim()) return { errors: [] as { path: string; message: string }[], parseError: "" };
    try {
      const schema = JSON.parse(schemaInput);
      const data = JSON.parse(dataInput);
      return { errors: validateAgainstSchema(data, schema), parseError: "" };
    } catch (e) {
      return { errors: [], parseError: e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON" };
    }
  }, [schemaInput, dataInput]);

  const textareaClass =
    "w-full h-[calc(100vh-360px)] min-h-[350px] p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="JSON Schema Generator"
      description="Infer a JSON Schema (draft-07) from a sample JSON object, or validate JSON against an existing schema"
    >
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden w-fit mb-4">
        <button
          onClick={() => setMode("generate")}
          className={`px-4 py-1.5 text-sm transition-colors ${mode === "generate" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Generate
        </button>
        <button
          onClick={() => setMode("validate")}
          className={`px-4 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "validate" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Validate
        </button>
      </div>

      {mode === "generate" ? (
        <>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">JSON Schema</label>
              <textarea
                value={schemaInput}
                onChange={(e) => setSchemaInput(e.target.value)}
                placeholder={'{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  },\n  "required": ["name"]\n}'}
                spellCheck={false}
                className="w-full h-64 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">JSON to validate</label>
              <textarea
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                placeholder={'{\n  "name": "Jane"\n}'}
                spellCheck={false}
                className="w-full h-64 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>

          {validation.parseError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mb-4">
              <AlertCircle size={12} /> {validation.parseError}
            </div>
          )}

          {!validation.parseError && schemaInput.trim() && dataInput.trim() && (
            <div className="space-y-2">
              {validation.errors.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
                  <CheckCircle size={16} className="shrink-0" />
                  Valid — the JSON conforms to the schema.
                </div>
              ) : (
                validation.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-xs">
                    <AlertCircle size={13} className="text-[#ef4444] shrink-0 mt-0.5" />
                    <span className="text-[#f5f5f5]">
                      <code className="text-[#ef4444] font-mono">{e.path}</code> — {e.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
}
