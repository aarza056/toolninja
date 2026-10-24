"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import FindingList from "@/components/FindingList";
import { checkSchema, fixSchema, unwrapSchema, type Provider } from "@/lib/llm-schema";
import { Wand2 } from "lucide-react";

const STORAGE_KEY = "toolninja:llm-schema-checker";

const EXAMPLE = `{
  "type": "object",
  "properties": {
    "title": { "type": "string", "maxLength": 120 },
    "rating": { "type": "integer", "minimum": 1, "maximum": 5 },
    "tags": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
    "author": {
      "type": "object",
      "properties": { "name": { "type": "string" }, "url": { "type": "string", "format": "uri" } }
    },
    "summary": { "type": "string", "nullable": true }
  },
  "required": ["title", "rating"]
}`;

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "openai", label: "OpenAI (strict)" },
  { id: "anthropic", label: "Claude" },
  { id: "gemini", label: "Gemini" },
];

function requestSnippet(provider: Provider, schema: object): string {
  if (provider === "openai") return JSON.stringify({ text: { format: { type: "json_schema", name: "result", strict: true, schema } } }, null, 2);
  if (provider === "anthropic") return JSON.stringify({ output_config: { format: { type: "json_schema", schema } } }, null, 2);
  return JSON.stringify({ generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema } }, null, 2);
}

export default function LlmSchemaCheckerClient() {
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [fixed, setFixed] = useState<{ target: "openai" | "anthropic"; text: string; changes: string[] } | null>(null);

  useEffect(() => {
    try {
      // An empty saved value counts as nothing saved, so the example comes back
      setInput(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    setFixed(null);
    // Never save the empty initial state (React runs effects twice in development)
    if (!input) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ...unwrapSchema(JSON.parse(input)), error: "" };
    } catch (e) {
      return { schema: null, wrapper: undefined, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input]);

  const results = useMemo(() => {
    if (!parsed?.schema) return null;
    return Object.fromEntries(PROVIDERS.map((p) => [p.id, checkSchema(parsed.schema!, p.id)])) as Record<Provider, ReturnType<typeof checkSchema>>;
  }, [parsed]);

  const runFix = (target: "openai" | "anthropic") => {
    if (!parsed?.schema) return;
    const r = fixSchema(parsed.schema, target);
    setFixed({ target, text: JSON.stringify(r.schema, null, 2), changes: r.changes });
  };

  const issues = results?.[provider] ?? [];
  const fixedSchema = fixed ? JSON.parse(fixed.text) : null;

  return (
    <ToolLayout title="Structured Output Schema Checker" description="See whether OpenAI, Claude and Gemini accept your JSON Schema for structured outputs — and fix it in one click">
      <div className="max-w-5xl grid lg:grid-cols-2 gap-6">
        <div className="space-y-2 min-w-0">
          <label className="text-xs text-[#888888] font-medium block">JSON Schema — or a whole response_format / tool definition</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={22}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {parsed?.error && <p className="text-xs text-[#f87171]">Invalid JSON: {parsed.error}</p>}
          {parsed?.wrapper && <p className="text-xs text-[#888888]">Checking the schema inside <code className="text-[#e879f9]">{parsed.wrapper}</code>.</p>}
          <p className="text-xs text-[#666666] leading-relaxed">
            Need a schema to start from? Generate one from sample JSON with the <Link href="/tools/json-schema-generator" className="text-[#a855f7] hover:underline">JSON Schema Generator</Link>.
          </p>
        </div>

        <div className="space-y-4 min-w-0">
          {results && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map((p) => {
                  const r = results[p.id];
                  const errors = r.filter((i) => i.level === "error").length;
                  const warnings = r.filter((i) => i.level === "warning").length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`p-3 text-left rounded-[8px] border transition-colors ${provider === p.id ? "border-[#a855f7]/60 bg-[#a855f7]/10" : "border-[#222222] bg-[#111111] hover:border-[#333333]"}`}
                    >
                      <p className="text-xs text-[#888888]">{p.label}</p>
                      <p className={`text-sm font-semibold ${errors ? "text-[#f87171]" : warnings ? "text-[#fbbf24]" : "text-[#4ade80]"}`}>
                        {errors ? `${errors} error${errors > 1 ? "s" : ""}` : warnings ? `${warnings} warning${warnings > 1 ? "s" : ""}` : "Accepted"}
                      </p>
                    </button>
                  );
                })}
              </div>

              <FindingList items={issues.map((i) => ({ level: i.level, title: i.message, meta: i.path }))} empty={`${PROVIDERS.find((p) => p.id === provider)!.label} accepts this schema as-is.`} />

              <div className="flex flex-wrap gap-2">
                <button onClick={() => runFix("openai")} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-[6px] bg-[#a855f7] hover:bg-[#9333ea] text-white">
                  <Wand2 size={13} /> Fix for OpenAI strict
                </button>
                <button onClick={() => runFix("anthropic")} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-[6px] bg-[#1a1a1a] border border-[#222222] hover:bg-[#222222] text-[#f5f5f5]">
                  <Wand2 size={13} /> Fix for Claude
                </button>
              </div>
            </>
          )}

          {fixed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#f5f5f5]">Fixed for {fixed.target === "openai" ? "OpenAI strict mode" : "Claude"} · {fixed.changes.length} change{fixed.changes.length === 1 ? "" : "s"}</p>
                <CopyButton text={fixed.text} size="sm" />
              </div>
              {fixed.changes.length > 0 && (
                <ul className="space-y-1 max-h-40 overflow-auto">
                  {fixed.changes.map((c, i) => (
                    <li key={i} className="text-xs text-[#999999] font-mono break-words">• {c}</li>
                  ))}
                </ul>
              )}
              <pre className="p-3 text-xs font-mono overflow-auto max-h-72 bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5]">{fixed.text}</pre>
              <p className="text-xs text-[#888888]">Where it goes in the request:</p>
              <div className="relative">
                <pre className="p-3 text-xs font-mono overflow-auto max-h-48 bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#cccccc]">{requestSnippet(fixed.target, fixedSchema)}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={requestSnippet(fixed.target, fixedSchema)} size="sm" />
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-[#666666] leading-relaxed">
            Rules follow each provider&apos;s structured-output docs (October 2026). Constraints the fix removes (like minimum or maxLength) aren&apos;t enforced by the model — check
            them after parsing, e.g. with Zod or Pydantic.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
