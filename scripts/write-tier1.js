const fs = require('fs');
const path = require('path');

const files = {};

// ============================================================
// JSON FORMATTER
// ============================================================
files['app/tools/json-formatter/page.tsx'] = `import type { Metadata } from "next";
import JsonFormatterClient from "./JsonFormatterClient";

export const metadata: Metadata = {
  title: "JSON Formatter & Validator Online — ToolNinja",
  description: "Format, validate and minify JSON instantly. Syntax highlighting, error detection, and auto-format on paste.",
};

export default function JsonFormatterPage() {
  return <JsonFormatterClient />;
}
`;

files['app/tools/json-formatter/JsonFormatterClient.tsx'] = `"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Braces, Minimize2, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:json-formatter";

function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /(\\s*"(\\\\.|[^"\\\\])*"\\s*):|("(\\\\.|[^"\\\\])*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
    function (match, _p1, _p2, p3) {
      if (_p1 !== undefined) {
        return \`<span class="json-key">\${match}</span>\`;
      }
      if (p3 !== undefined) {
        let cls = "json-string";
        if (p3 === "true" || p3 === "false") cls = "json-bool";
        else if (p3 === "null") cls = "json-null";
        else if (/^-?\\d/.test(p3)) cls = "json-number";
        return \`<span class="\${cls}">\${p3}</span>\`;
      }
      return match;
    }
  );
}

export default function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indentSize] = useState(2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const format = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput("");
      setError("");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setOutput(JSON.stringify(parsed, null, indentSize));
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  }, [indentSize]);

  const minify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setTimeout(() => format(text), 0);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "X") {
        e.preventDefault();
        clear();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Format, validate and minify JSON instantly"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => format(input)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
        >
          <Braces size={14} />
          Format
        </button>
        <button
          onClick={minify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Minimize2 size={14} />
          Minify
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
          title="Clear (Ctrl+Shift+X)"
        >
          <Trash2 size={14} />
          Clear
        </button>
        {output && <CopyButton text={output} />}
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              format(e.target.value);
            }}
            onPaste={handlePaste}
            placeholder='Paste or type JSON here...'
            className={\`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] \${error ? "border-[#ef4444]" : "border-[#222222]"}\`}
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
          <label className="text-xs text-[#888888] font-medium">Formatted Output</label>
          <div
            className="flex-1 p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto"
            style={{ minHeight: 0 }}
          >
            {output ? (
              <pre
                className="text-sm leading-relaxed m-0 p-0 bg-transparent border-0"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            ) : (
              <p className="text-[#444444] text-sm italic">
                {error ? "Fix the JSON error to see output" : "Formatted JSON will appear here..."}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{\`
        .json-key { color: #a855f7; }
        .json-string { color: #22c55e; }
        .json-number { color: #f97316; }
        .json-bool { color: #3b82f6; }
        .json-null { color: #888888; }
      \`}</style>
    </ToolLayout>
  );
}
`;

// ============================================================
// BASE64
// ============================================================
files['app/tools/base64/page.tsx'] = `import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encoder & Decoder Online — ToolNinja",
  description: "Encode and decode Base64 strings instantly in your browser. No data is sent to any server.",
};

export default function Base64Page() {
  return <Base64Client />;
}
`;

files['app/tools/base64/Base64Client.tsx'] = `"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Lock, Unlock, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:base64";

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const encode = () => {
    setError("");
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))));
    } catch {
      setError("Failed to encode. Check your input.");
    }
  };

  const decode = () => {
    setError("");
    try {
      setOutput(decodeURIComponent(escape(atob(input.trim()))));
    } catch {
      setError("Invalid Base64 string.");
    }
  };

  const clear = () => { setInput(""); setOutput(""); setError(""); };

  return (
    <ToolLayout title="Base64 Encoder / Decoder" description="Encode or decode Base64 strings instantly">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={encode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors">
          <Lock size={14} /> Encode
        </button>
        <button onClick={decode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors">
          <Unlock size={14} /> Decode
        </button>
        <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors">
          <Trash2 size={14} /> Clear
        </button>
        {output && <CopyButton text={output} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or Base64 string..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Output</label>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// URL ENCODER
// ============================================================
files['app/tools/url-encoder/page.tsx'] = `import type { Metadata } from "next";
import UrlEncoderClient from "./UrlEncoderClient";

export const metadata: Metadata = {
  title: "URL Encoder & Decoder Online — ToolNinja",
  description: "Encode and decode URLs and query parameters instantly in your browser.",
};

export default function UrlEncoderPage() {
  return <UrlEncoderClient />;
}
`;

files['app/tools/url-encoder/UrlEncoderClient.tsx'] = `"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Link2, Unlink2, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:url-encoder";

export default function UrlEncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const encode = () => {
    setError("");
    try { setOutput(encodeURIComponent(input)); }
    catch { setError("Failed to encode."); }
  };

  const decode = () => {
    setError("");
    try { setOutput(decodeURIComponent(input)); }
    catch { setError("Invalid URL-encoded string."); }
  };

  const clear = () => { setInput(""); setOutput(""); setError(""); };

  return (
    <ToolLayout title="URL Encoder / Decoder" description="Encode and decode URLs and query parameters">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={encode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors">
          <Link2 size={14} /> Encode
        </button>
        <button onClick={decode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors">
          <Unlink2 size={14} /> Decode
        </button>
        <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors">
          <Trash2 size={14} /> Clear
        </button>
        {output && <CopyButton text={output} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL or encoded string..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Output</label>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none"
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// REGEX TESTER
// ============================================================
files['app/tools/regex-tester/page.tsx'] = `import type { Metadata } from "next";
import RegexTesterClient from "./RegexTesterClient";

export const metadata: Metadata = {
  title: "Regex Tester Online — ToolNinja",
  description: "Test and debug regular expressions with live match highlighting, match count, and captured groups.",
};

export default function RegexTesterPage() {
  return <RegexTesterClient />;
}
`;

files['app/tools/regex-tester/RegexTesterClient.tsx'] = `"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:regex-tester";

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.pattern) setPattern(d.pattern);
        if (d.testString) setTestString(d.testString);
        if (d.flags) setFlags(d.flags);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pattern, testString, flags }));
    } catch {}
  }, [pattern, testString, flags]);

  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("");

  const { highlighted, matches, groups } = useMemo(() => {
    if (!pattern || !testString) return { highlighted: testString, matches: [], groups: [] };
    setError("");
    try {
      const regex = new RegExp(pattern, flagStr.includes("g") ? flagStr : flagStr + "g");
      const allMatches = [...testString.matchAll(regex)];
      const groupList: string[][] = allMatches.map((m) => m.slice(1).filter(Boolean));
      
      let result = "";
      let lastIndex = 0;
      for (const m of allMatches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        result += escapeHtml(testString.slice(lastIndex, start));
        result += \`<mark class="regex-match">\${escapeHtml(m[0])}</mark>\`;
        lastIndex = end;
      }
      result += escapeHtml(testString.slice(lastIndex));
      return { highlighted: result, matches: allMatches, groups: groupList };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid regex");
      return { highlighted: escapeHtml(testString), matches: [], groups: [] };
    }
  }, [pattern, testString, flagStr]);

  function escapeHtml(s: string) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  return (
    <ToolLayout title="Regex Tester" description="Test regular expressions with live match highlighting">
      {/* Pattern + Flags */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#888888] font-mono text-sm">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className={\`flex-1 px-3 py-2 font-mono text-sm bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] \${error ? "border-[#ef4444]" : "border-[#222222]"}\`}
            spellCheck={false}
          />
          <span className="text-[#888888] font-mono text-sm">/{flagStr}</span>
        </div>
        <div className="flex gap-4">
          {(["g", "i", "m", "s"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm text-[#888888] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flags[f]}
                onChange={(e) => setFlags(prev => ({ ...prev, [f]: e.target.checked }))}
                className="accent-[#a855f7]"
              />
              <span className="font-mono">{f}</span>
              <span className="text-xs text-[#555555]">
                {f === "g" ? "global" : f === "i" ? "insensitive" : f === "m" ? "multiline" : "dotAll"}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Match count */}
      {pattern && !error && (
        <div className="mb-3 text-sm text-[#888888]">
          {matches.length === 0 ? "No matches found" : (
            <span>Found <span className="text-[#a855f7] font-semibold">{matches.length}</span> {matches.length === 1 ? "match" : "matches"}</span>
          )}
        </div>
      )}

      {/* Test string */}
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">Test String</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter test string..."
          rows={6}
          className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          spellCheck={false}
        />
      </div>

      {/* Highlighted output */}
      {pattern && testString && (
        <div className="mb-4">
          <label className="text-xs text-[#888888] font-medium block mb-1">Match Preview</label>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}

      {/* Groups */}
      {groups.flat().length > 0 && (
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Captured Groups</label>
          <div className="space-y-1">
            {groups.map((grp, i) => grp.map((g, j) => (
              <div key={\`\${i}-\${j}\`} className="flex items-center gap-2 text-xs">
                <span className="text-[#a855f7] font-mono">Match {i + 1}, Group {j + 1}:</span>
                <span className="font-mono text-[#f5f5f5] bg-[#1a1a1a] px-2 py-0.5 rounded">{g}</span>
              </div>
            )))}
          </div>
        </div>
      )}

      <style>{\`
        .regex-match {
          background-color: rgba(251, 191, 36, 0.3);
          color: #fbbf24;
          border-radius: 2px;
          padding: 0 1px;
        }
      \`}</style>
    </ToolLayout>
  );
}
`;

// ============================================================
// COLOR CONVERTER
// ============================================================
files['app/tools/color-converter/page.tsx'] = `import type { Metadata } from "next";
import ColorConverterClient from "./ColorConverterClient";

export const metadata: Metadata = {
  title: "Color Converter — HEX, RGB, HSL — ToolNinja",
  description: "Convert colors between HEX, RGB, and HSL formats with a live color preview and picker.",
};

export default function ColorConverterPage() {
  return <ColorConverterClient />;
}
`;

files['app/tools/color-converter/ColorConverterClient.tsx'] = `"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

function hexToRgb(hex: string): [number, number, number] | null {
  const r = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex.trim());
  if (!r) return null;
  return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function parseInput(raw: string): [number, number, number] | null {
  raw = raw.trim();
  if (raw.startsWith("#") || /^[a-f0-9]{3,6}$/i.test(raw)) {
    const hex = raw.startsWith("#") ? raw : "#" + raw;
    return hexToRgb(hex);
  }
  let m = raw.match(/rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)/i);
  if (m) return [+m[1], +m[2], +m[3]];
  m = raw.match(/hsl\\(\\s*(\\d+)\\s*,\\s*(\\d+)%?\\s*,\\s*(\\d+)%?\\s*\\)/i);
  if (m) return hslToRgb(+m[1], +m[2], +m[3]);
  return null;
}

export default function ColorConverterClient() {
  const [input, setInput] = useState("#a855f7");
  const [pickerColor, setPickerColor] = useState("#a855f7");
  const [error, setError] = useState("");

  const rgb = useCallback(() => {
    const r = parseInput(input);
    if (!r) return null;
    return r;
  }, [input]);

  const colors = useCallback(() => {
    const r = rgb();
    if (!r) return null;
    const [red, green, blue] = r;
    const [h, s, l] = rgbToHsl(red, green, blue);
    const hex = rgbToHex(red, green, blue);
    return { hex, rgb: \`rgb(\${red}, \${green}, \${blue})\`, hsl: \`hsl(\${h}, \${s}%, \${l}%)\` };
  }, [rgb]);

  const result = colors();

  const handleInput = (val: string) => {
    setInput(val);
    const r = parseInput(val);
    if (r) {
      setPickerColor(rgbToHex(...r));
      setError("");
    } else {
      setError("Unrecognized color format");
    }
  };

  const handlePicker = (val: string) => {
    setPickerColor(val);
    setInput(val);
    setError("");
  };

  return (
    <ToolLayout title="Color Converter" description="Convert between HEX, RGB, and HSL color formats">
      <div className="max-w-lg">
        {/* Color preview + picker row */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-[8px] border border-[#222222] flex-shrink-0"
            style={{ background: result?.hex || "#222222" }}
          />
          <div className="flex flex-col gap-2">
            <input
              type="color"
              value={pickerColor}
              onChange={(e) => handlePicker(e.target.value)}
              className="h-8 w-24 cursor-pointer rounded-[6px] border border-[#222222] bg-[#111111] p-0.5"
              title="Pick a color"
            />
            <p className="text-xs text-[#888888]">Click to pick any color</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="text-xs text-[#888888] font-medium block mb-1">Color Input (HEX, RGB, or HSL)</label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="#a855f7 or rgb(168,85,247) or hsl(271,91%,65%)"
            className={\`w-full px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] \${error ? "border-[#ef4444]" : "border-[#222222]"}\`}
            spellCheck={false}
          />
          {error && <p className="text-xs text-[#ef4444] mt-1">{error}</p>}
        </div>

        {/* Conversions */}
        {result && (
          <div className="space-y-3">
            {(["hex", "rgb", "hsl"] as const).map((fmt) => (
              <div key={fmt} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <span className="w-8 text-xs font-semibold text-[#888888] uppercase">{fmt}</span>
                <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{result[fmt]}</code>
                <CopyButton text={result[fmt]} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// LOREM IPSUM
// ============================================================
files['app/tools/lorem-ipsum/page.tsx'] = `import type { Metadata } from "next";
import LoremIpsumClient from "./LoremIpsumClient";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator — ToolNinja",
  description: "Generate placeholder lorem ipsum text by paragraphs, sentences or words.",
};

export default function LoremIpsumPage() {
  return <LoremIpsumClient />;
}
`;

files['app/tools/lorem-ipsum/LoremIpsumClient.tsx'] = `"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Shuffle } from "lucide-react";

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis".split(" ");

const CLASSIC_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function getWord() {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function getSentence(wordCount = 10): string {
  const words = Array.from({ length: wordCount }, (_, i) => {
    const w = getWord();
    return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  return words.join(" ") + ".";
}

function getParagraph(sentenceCount = 5): string {
  return Array.from({ length: sentenceCount }, () => getSentence(8 + Math.floor(Math.random() * 8))).join(" ");
}

export default function LoremIpsumClient() {
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [output, setOutput] = useState("");

  const generate = () => {
    let result = "";
    if (type === "paragraphs") {
      const paras = Array.from({ length: count }, (_, i) =>
        i === 0 && classic ? CLASSIC_START + " " + getParagraph(4) : getParagraph()
      );
      result = paras.join("\\n\\n");
    } else if (type === "sentences") {
      const sentences = Array.from({ length: count }, (_, i) =>
        i === 0 && classic ? CLASSIC_START : getSentence()
      );
      result = sentences.join(" ");
    } else {
      const words = Array.from({ length: count }, (_, i) => {
        const w = getWord();
        return i === 0 && classic ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      });
      result = words.join(" ");
    }
    setOutput(result);
  };

  return (
    <ToolLayout title="Lorem Ipsum Generator" description="Generate placeholder text for your designs">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Type</label>
            <div className="flex">
              {(["paragraphs", "sentences", "words"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={\`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors \${
                    type === t
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }\`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))}
              className="w-20 px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#888888] cursor-pointer pb-1.5">
            <input
              type="checkbox"
              checked={classic}
              onChange={(e) => setClassic(e.target.checked)}
              className="accent-[#a855f7]"
            />
            Start with classic "Lorem ipsum..."
          </label>

          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors pb-1.5"
          >
            <Shuffle size={14} /> Generate
          </button>
        </div>

        {output ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">Output</label>
              <CopyButton text={output} size="sm" />
            </div>
            <textarea
              value={output}
              readOnly
              rows={12}
              className="w-full p-3 text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create placeholder text
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
`;

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Written:', filePath);
}
