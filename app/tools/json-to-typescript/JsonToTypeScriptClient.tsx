"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, Trash2 } from "lucide-react";

const STORAGE_KEY = "toolninja:json-to-typescript";

// ── Type inference ─────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeName(s: string): string {
  // Turn any non-alphanumeric sequence into capitalised word boundaries
  return s
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9]/, "_$&");
}

interface ConversionResult {
  rootType: string;
  interfaces: string[];
}

function inferType(
  value: unknown,
  name: string,
  interfaces: Map<string, string>,
  optional: boolean,
  useTypeAlias: boolean,
  exportKw: boolean
): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";

  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";

    // Collect all element types
    const elementTypes = value.map((item) =>
      inferType(item, `${name}Item`, interfaces, optional, useTypeAlias, exportKw)
    );

    // Deduplicate
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const t of elementTypes) {
      if (!seen.has(t)) { seen.add(t); unique.push(t); }
    }

    if (unique.length === 1) {
      const et = unique[0];
      // Array of objects already registered an interface — just use its name
      return `${et}[]`;
    }
    return `(${unique.join(" | ")})[]`;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const interfaceName = capitalize(sanitizeName(name));

    // Merge shapes if this is an array element (called with same name repeatedly)
    const lines: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const childName = interfaceName + capitalize(sanitizeName(key));
      const typeSuffix = optional ? "?" : "";
      const propType = inferType(val, childName, interfaces, optional, useTypeAlias, exportKw);
      lines.push(`  ${propName}${typeSuffix}: ${propType};`);
    }

    const exp = exportKw ? "export " : "";
    let decl: string;
    if (useTypeAlias) {
      decl = `${exp}type ${interfaceName} = {\n${lines.join("\n")}\n};`;
    } else {
      decl = `${exp}interface ${interfaceName} {\n${lines.join("\n")}\n}`;
    }

    // Only add if not already present (handles shared sub-types)
    if (!interfaces.has(interfaceName)) {
      interfaces.set(interfaceName, decl);
    }

    return interfaceName;
  }

  return "unknown";
}

function jsonToTypeScript(
  json: string,
  rootName: string,
  useTypeAlias: boolean,
  optional: boolean,
  exportKw: boolean
): ConversionResult {
  const parsed = JSON.parse(json);
  const interfaces = new Map<string, string>();
  const safeName = capitalize(sanitizeName(rootName || "Root"));

  const rootType = inferType(parsed, safeName, interfaces, optional, useTypeAlias, exportKw);

  // If root is a primitive/array-of-primitive, we still want a named alias
  const declarations: string[] = [];
  interfaces.forEach((v) => declarations.push(v));

  if (declarations.length === 0) {
    // Root is primitive or array of primitives — emit a type alias
    const exp = exportKw ? "export " : "";
    declarations.push(`${exp}type ${safeName} = ${rootType};`);
  }

  return { rootType, interfaces: declarations };
}

// ── Syntax highlight ───────────────────────────────────────────────────────────

function highlightTs(code: string): string {
  // Escape HTML first
  let s = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // interface / type / export keywords  → purple
  s = s.replace(
    /\b(export|interface|type)\b/g,
    '<span class="ts-kw">$1</span>'
  );

  // type names (capitalized word after interface/type/= or after : on its own)
  // Match PascalCase identifiers that are type names (after interface, =, :, |, (, [)
  s = s.replace(
    /(?<=(?:interface|type)\s+)([A-Z][A-Za-z0-9_]*)/g,
    '<span class="ts-typename">$1</span>'
  );

  // Property names (before the colon, indented lines)
  s = s.replace(
    /^(\s+)("?[a-zA-Z_$][a-zA-Z0-9_$"]*"?\??)(?=:)/gm,
    '$1<span class="ts-propname">$2</span>'
  );

  // Type values after colon (string, number, boolean, null, unknown, arrays, union members)
  s = s.replace(
    /(?<=:\s*)([a-z][a-zA-Z0-9_[\]()| ]*(?:\[\])*)/g,
    '<span class="ts-typevalue">$1</span>'
  );

  // PascalCase type references after colon (sub-interfaces)
  s = s.replace(
    /(?<=:\s*)([A-Z][A-Za-z0-9_]*(?:\[\])*)/g,
    '<span class="ts-typename">$1</span>'
  );

  return s;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function JsonToTypeScriptClient() {
  const [input, setInput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [useTypeAlias, setUseTypeAlias] = useState(false);
  const [optionalFields, setOptionalFields] = useState(false);
  const [exportKw, setExportKw] = useState(true);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  // Persist input
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const convert = useCallback(
    (text: string, name: string, alias: boolean, opt: boolean, exp: boolean) => {
      if (!text.trim()) {
        setOutput("");
        setError("");
        return;
      }
      try {
        const { interfaces } = jsonToTypeScript(text, name, alias, opt, exp);
        setOutput(interfaces.join("\n\n"));
        setError("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Invalid JSON");
        setOutput("");
      }
    },
    []
  );

  // Re-run conversion whenever any option changes
  useEffect(() => {
    convert(input, rootName, useTypeAlias, optionalFields, exportKw);
  }, [input, rootName, useTypeAlias, optionalFields, exportKw, convert]);

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const ToggleButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
        active
          ? "bg-[#a855f7] border-[#a855f7] text-white"
          : "bg-[#1a1a1a] border-[#222222] text-[#888888] hover:text-[#f5f5f5] hover:border-[#333333]"
      }`}
    >
      {children}
    </button>
  );

  return (
    <ToolLayout
      title="JSON → TypeScript"
      description="Generate TypeScript interfaces from JSON automatically"
    >
      {/* Options row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Interface name */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#888888] whitespace-nowrap">Root name</label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value || "Root")}
            className="w-28 px-2 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        {/* interface vs type alias */}
        <div className="flex items-center gap-1 bg-[#111111] border border-[#222222] rounded-[6px] p-0.5">
          <ToggleButton active={!useTypeAlias} onClick={() => setUseTypeAlias(false)}>
            interface
          </ToggleButton>
          <ToggleButton active={useTypeAlias} onClick={() => setUseTypeAlias(true)}>
            type alias
          </ToggleButton>
        </div>

        {/* Optional fields */}
        <ToggleButton active={optionalFields} onClick={() => setOptionalFields((v) => !v)}>
          Optional fields {optionalFields ? "on" : "off"}
        </ToggleButton>

        {/* Export keyword */}
        <ToggleButton active={exportKw} onClick={() => setExportKw((v) => !v)}>
          export {exportKw ? "on" : "off"}
        </ToggleButton>

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">JSON Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'{\n  "name": "Alice",\n  "age": 30,\n  "address": {\n    "city": "London"\n  }\n}'}
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
              error ? "border-[#ef4444]" : "border-[#222222]"
            }`}
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">TypeScript Output</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <div
            className="flex-1 p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto"
            style={{ minHeight: 0 }}
          >
            {output ? (
              <pre
                className="m-0 p-0 bg-transparent border-0 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightTs(output) }}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            ) : (
              <p className="text-[#444444] text-sm italic">
                {error
                  ? "Fix the JSON error to see output"
                  : "TypeScript interfaces will appear here…"}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ts-kw        { color: #a855f7; }
        .ts-typename  { color: #60a5fa; }
        .ts-propname  { color: #4ade80; }
        .ts-typevalue { color: #fb923c; }
      `}</style>
    </ToolLayout>
  );
}
