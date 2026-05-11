"use client";

import { useState, useCallback } from "react";
import yaml from "js-yaml";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle2, Trash2, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Format = "auto" | "json" | "yaml" | "toml";
type DetectedFormat = "json" | "yaml" | "toml" | null;

interface ValidationResult {
  valid: boolean;
  format: DetectedFormat;
  error: string;
  parsed: unknown;
}

// ─── Minimal TOML parser ─────────────────────────────────────────────────────

function parseToml(src: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current: Record<string, unknown> = root;

  const lines = src.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const rawLine = lines[lineNo];
    // Strip comments and trim
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    // Section header: [section] or [section.sub]
    const sectionMatch = line.match(/^\[([^\[\]]+)\]$/);
    if (sectionMatch) {
      const parts = sectionMatch[1].trim().split(".");
      let node: Record<string, unknown> = root;
      for (const part of parts) {
        const key = part.trim();
        if (!(key in node)) node[key] = {};
        const child = node[key];
        if (typeof child !== "object" || child === null || Array.isArray(child)) {
          throw new Error(
            `TOML: Section key "${key}" already defined as a non-table (line ${lineNo + 1})`
          );
        }
        node = child as Record<string, unknown>;
      }
      current = node;
      continue;
    }

    // Key = value
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) {
      throw new Error(`TOML: Expected key = value on line ${lineNo + 1}: "${rawLine.trim()}"`);
    }

    const key = line.slice(0, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    current[key] = parseTomlValue(rawVal, lineNo + 1);
  }

  return root;
}

function parseTomlValue(raw: string, lineNo: number): unknown {
  // Inline array
  if (raw.startsWith("[")) {
    if (!raw.endsWith("]")) {
      throw new Error(`TOML: Unclosed array on line ${lineNo}`);
    }
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => parseTomlValue(item.trim(), lineNo));
  }

  // Double-quoted string
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }

  // Single-quoted string (literal)
  if (raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1);
  }

  // Boolean
  if (raw === "true") return true;
  if (raw === "false") return false;

  // Number
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(raw)) {
    return raw.includes(".") || raw.includes("e") || raw.includes("E")
      ? parseFloat(raw)
      : parseInt(raw, 10);
  }

  // Fallback: treat as bare string
  return raw;
}

// ─── TOML serialiser (minimal) ───────────────────────────────────────────────

function dumpToml(obj: unknown, prefix = ""): string {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new Error("Top-level TOML value must be an object");
  }
  const record = obj as Record<string, unknown>;
  const scalarLines: string[] = [];
  const tableSections: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      Array.isArray(value)
    ) {
      scalarLines.push(`${key} = ${tomlValueStr(value)}`);
    } else if (typeof value === "object") {
      // Table section: emit [fullKey] header then recurse with empty prefix for scalars
      tableSections.push(`\n[${fullKey}]\n${dumpToml(value, fullKey)}`);
    }
  }

  return [...scalarLines, ...tableSections].join("\n");
}

function tomlValueStr(v: unknown): string {
  if (v === null) return '""';
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  if (Array.isArray(v)) return `[${v.map(tomlValueStr).join(", ")}]`;
  return '""';
}

// ─── Validators ───────────────────────────────────────────────────────────────

function tryJson(src: string): ValidationResult {
  try {
    const parsed = JSON.parse(src);
    return { valid: true, format: "json", error: "", parsed };
  } catch (e: unknown) {
    return {
      valid: false,
      format: "json",
      error: `JSON: ${e instanceof Error ? e.message : "Parse error"}`,
      parsed: null,
    };
  }
}

function tryYaml(src: string): ValidationResult {
  try {
    const parsed = yaml.load(src);
    return { valid: true, format: "yaml", error: "", parsed };
  } catch (e: unknown) {
    return {
      valid: false,
      format: "yaml",
      error: `YAML: ${e instanceof Error ? e.message : "Parse error"}`,
      parsed: null,
    };
  }
}

function tryToml(src: string): ValidationResult {
  try {
    const parsed = parseToml(src);
    return { valid: true, format: "toml", error: "", parsed };
  } catch (e: unknown) {
    return {
      valid: false,
      format: "toml",
      error: `TOML: ${e instanceof Error ? e.message : "Parse error"}`,
      parsed: null,
    };
  }
}

function validate(src: string, hint: Format): ValidationResult {
  if (!src.trim()) {
    return { valid: false, format: null, error: "", parsed: null };
  }

  if (hint === "json") return tryJson(src);
  if (hint === "yaml") return tryYaml(src);
  if (hint === "toml") return tryToml(src);

  // Auto: try in order
  const jsonResult = tryJson(src);
  if (jsonResult.valid) return jsonResult;

  const yamlResult = tryYaml(src);
  if (yamlResult.valid) return yamlResult;

  const tomlResult = tryToml(src);
  if (tomlResult.valid) return tomlResult;

  // Return the most likely error based on heuristics
  const looksLikeToml = /^\s*\[/.test(src) || /^\s*\w+\s*=/.test(src);
  const looksLikeYaml = /:\s/.test(src) || /^---/.test(src);

  if (looksLikeToml) return tomlResult;
  if (looksLikeYaml) return yamlResult;
  return jsonResult;
}

// ─── Converters ───────────────────────────────────────────────────────────────

function convertTo(
  parsed: unknown,
  targetFormat: "json" | "yaml" | "toml"
): string {
  if (targetFormat === "json") {
    return JSON.stringify(parsed, null, 2);
  }
  if (targetFormat === "yaml") {
    return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
  }
  // toml
  return dumpToml(parsed).trim();
}

// ─── Sample inputs ────────────────────────────────────────────────────────────

const SAMPLE_JSON = `{
  "name": "my-app",
  "version": "1.0.0",
  "debug": false,
  "port": 3000,
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  },
  "tags": ["web", "api", "v1"]
}`;

// ─── Main component ──────────────────────────────────────────────────────────

export default function ConfigValidatorClient() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [hint, setHint] = useState<Format>("auto");
  const [result, setResult] = useState<ValidationResult>(() =>
    validate(SAMPLE_JSON, "auto")
  );
  const [output, setOutput] = useState("");
  const [outputFormat, setOutputFormat] = useState<"json" | "yaml" | "toml" | null>(null);
  const [convertError, setConvertError] = useState("");

  const handleInput = useCallback(
    (value: string, currentHint: Format) => {
      setInput(value);
      const r = validate(value, currentHint);
      setResult(r);
      setOutput("");
      setOutputFormat(null);
      setConvertError("");
    },
    []
  );

  const handleHint = (f: Format) => {
    setHint(f);
    const r = validate(input, f);
    setResult(r);
    setOutput("");
    setOutputFormat(null);
    setConvertError("");
  };

  const handleConvert = (target: "json" | "yaml" | "toml") => {
    if (!result.valid || result.parsed === undefined) return;
    try {
      const converted = convertTo(result.parsed, target);
      setOutput(converted);
      setOutputFormat(target);
      setConvertError("");
    } catch (e: unknown) {
      setConvertError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
      setOutputFormat(null);
    }
  };

  const clear = () => {
    setInput("");
    setResult({ valid: false, format: null, error: "", parsed: null });
    setOutput("");
    setOutputFormat(null);
    setConvertError("");
  };

  const detectedLabel = result.format
    ? result.format.toUpperCase()
    : null;

  const hintFormats: { id: Format; label: string }[] = [
    { id: "auto", label: "Auto" },
    { id: "json", label: "JSON" },
    { id: "yaml", label: "YAML" },
    { id: "toml", label: "TOML" },
  ];

  return (
    <ToolLayout
      title="Config Validator"
      description="Validate and convert between JSON, YAML, and TOML formats"
    >
      {/* Format selector + status */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Format hint tabs */}
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          {hintFormats.map((f) => (
            <button
              key={f.id}
              onClick={() => handleHint(f.id)}
              className={`px-3 py-1.5 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                hint === f.id
                  ? "bg-[#a855f7] text-white"
                  : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Validation status badge */}
        {input.trim() && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
              result.valid
                ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
            }`}
          >
            {result.valid ? (
              <>
                <CheckCircle2 size={11} />
                Valid {detectedLabel}
              </>
            ) : (
              <>
                <AlertCircle size={11} />
                Invalid
              </>
            )}
          </div>
        )}

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Input */}
      <div className="mb-3">
        <label className="text-xs text-[#888888] font-medium block mb-1">Input</label>
        <textarea
          rows={12}
          value={input}
          onChange={(e) => handleInput(e.target.value, hint)}
          placeholder="Paste JSON, YAML, or TOML here..."
          spellCheck={false}
          className={`w-full p-3 font-mono text-sm resize-y bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
            input.trim() && !result.valid
              ? "border-[#ef4444]"
              : "border-[#222222]"
          }`}
        />
        {result.error && (
          <div className="flex items-start gap-1.5 text-xs text-[#ef4444] mt-1.5 break-words">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}
      </div>

      {/* Convert buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-[#888888]">Convert to:</span>
        {(["json", "yaml", "toml"] as const).map((fmt) => {
          const isSameFormat = result.format === fmt;
          const disabled = !result.valid || isSameFormat;
          return (
            <button
              key={fmt}
              onClick={() => handleConvert(fmt)}
              disabled={disabled}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-[6px] transition-colors border ${
                disabled
                  ? "border-[#1a1a1a] bg-[#111111] text-[#444444] cursor-not-allowed"
                  : outputFormat === fmt
                  ? "border-[#a855f7] bg-[#a855f7]/10 text-[#a855f7]"
                  : "border-[#222222] bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5]"
              }`}
            >
              <ArrowRight size={12} />
              {fmt.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Output */}
      {(output || convertError) && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              {outputFormat ? `Output (${outputFormat.toUpperCase()})` : "Output"}
            </label>
            {output && <CopyButton text={output} size="sm" />}
          </div>

          {convertError ? (
            <div className="flex items-start gap-1.5 text-xs text-[#ef4444] p-3 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-[8px]">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{convertError}</span>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-3 overflow-auto max-h-80">
              <pre className="font-mono text-sm text-[#f5f5f5] leading-relaxed m-0 p-0 bg-transparent whitespace-pre-wrap break-words">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
