const fs = require('fs');
const path = require('path');

const files = {};

// ============================================================
// JWT DECODER
// ============================================================
files['app/tools/jwt-decoder/page.tsx'] = `import type { Metadata } from "next";
import JwtDecoderClient from "./JwtDecoderClient";

export const metadata: Metadata = {
  title: "JWT Decoder Online — ToolNinja",
  description: "Decode and inspect JWT tokens. View header, payload, expiry, and check if token is expired.",
};

export default function JwtDecoderPage() {
  return <JwtDecoderClient />;
}
`;

files['app/tools/jwt-decoder/JwtDecoderClient.tsx'] = `"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const STORAGE_KEY = "toolninja:jwt-decoder";

function b64Decode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return atob(str);
  }
}

function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return \`<span class="\${cls}">\${match}</span>\`;
    }
  );
}

export default function JwtDecoderClient() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<{ header: unknown; payload: unknown; signature: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setToken(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, token); } catch {}
    if (!token.trim()) { setDecoded(null); setError(""); return; }
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 3) throw new Error("JWT must have 3 parts separated by dots");
      const header = JSON.parse(b64Decode(parts[0]));
      const payload = JSON.parse(b64Decode(parts[1]));
      setDecoded({ header, payload, signature: parts[2] });
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JWT");
      setDecoded(null);
    }
  }, [token]);

  const payload = decoded?.payload as Record<string, unknown> | null;
  const exp = payload?.exp ? Number(payload.exp) : null;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = exp !== null && exp < now;
  const expiryDate = exp ? new Date(exp * 1000) : null;

  const sections = decoded ? [
    { label: "Header", color: "#a855f7", data: decoded.header },
    { label: "Payload", color: "#3b82f6", data: decoded.payload },
    { label: "Signature", color: "#ef4444", data: decoded.signature },
  ] : [];

  return (
    <ToolLayout title="JWT Decoder" description="Decode and inspect JWT tokens">
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT token here..."
          rows={3}
          className={\`w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] \${error ? "border-[#ef4444]" : "border-[#222222]"}\`}
          spellCheck={false}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Expiry badge */}
      {expiryDate && (
        <div className={\`flex items-center gap-2 mb-4 px-3 py-2 rounded-[6px] text-sm \${isExpired ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]" : "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"}\`}>
          {isExpired ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <span>{isExpired ? "Token is expired" : "Token is valid"}</span>
          <span className="text-[#888888] flex items-center gap-1">
            <Clock size={12} />
            Expires: {expiryDate.toLocaleString()}
          </span>
        </div>
      )}

      {/* Decoded sections */}
      {sections.map((s) => (
        <div key={s.label} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</label>
            <CopyButton text={typeof s.data === "string" ? s.data : JSON.stringify(s.data, null, 2)} size="sm" />
          </div>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border rounded-[8px] overflow-auto"
            style={{ borderColor: s.color + "33" }}
          >
            {typeof s.data === "string" ? (
              <span className="text-[#888888] break-all">{s.data}</span>
            ) : (
              <pre
                className="m-0 p-0 bg-transparent border-0 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(s.data) }}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            )}
          </div>
        </div>
      ))}

      {!decoded && !error && !token && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste a JWT token above to decode it
        </div>
      )}

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
// MARKDOWN PREVIEW
// ============================================================
files['app/tools/markdown-preview/page.tsx'] = `import type { Metadata } from "next";
import MarkdownPreviewClient from "./MarkdownPreviewClient";

export const metadata: Metadata = {
  title: "Markdown Preview Online — ToolNinja",
  description: "Write and preview Markdown in real time. Supports GFM tables, code blocks, and more.",
};

export default function MarkdownPreviewPage() {
  return <MarkdownPreviewClient />;
}
`;

files['app/tools/markdown-preview/MarkdownPreviewClient.tsx'] = `"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "toolninja:markdown-preview";

const DEFAULT_MD = \`# Hello, ToolNinja!

This is a **live Markdown preview**.

## Features
- Real-time rendering
- GFM support (tables, strikethrough, etc.)
- Code highlighting

## Code Example

\\\`\\\`\\\`typescript
const greet = (name: string) => \\\`Hello, \\\${name}!\\\`;
console.log(greet("World"));
\\\`\\\`\\\`

## Table

| Tool | Category | Description |
|------|----------|-------------|
| JSON Formatter | Format | Format JSON |
| Base64 | Encode | Encode/Decode |
| Regex Tester | Test | Test patterns |

> Your data never leaves the browser 🔒
\`;

export default function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMarkdown(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, markdown); } catch {}
  }, [markdown]);

  return (
    <ToolLayout title="Markdown Preview" description="Write and preview Markdown in real time">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Editor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Markdown</label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Preview</label>
          <div className="flex-1 overflow-auto p-4 bg-[#111111] border border-[#222222] rounded-[8px] prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <style>{\`
        .prose h1, .prose h2, .prose h3 { color: #f5f5f5; }
        .prose p { color: #d4d4d4; }
        .prose strong { color: #f5f5f5; }
        .prose code { background: #1a1a1a; color: #a855f7; padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.875em; }
        .prose pre { background: #1a1a1a; border: 1px solid #222; border-radius: 8px; }
        .prose pre code { background: transparent; color: #f5f5f5; padding: 0; }
        .prose blockquote { border-left-color: #a855f7; color: #888888; }
        .prose table { border-collapse: collapse; width: 100%; }
        .prose th { background: #1a1a1a; color: #f5f5f5; padding: 0.5rem 0.75rem; border: 1px solid #222; }
        .prose td { padding: 0.5rem 0.75rem; border: 1px solid #222; color: #d4d4d4; }
        .prose a { color: #a855f7; }
        .prose hr { border-color: #222; }
        .prose ul li::marker, .prose ol li::marker { color: #888888; }
      \`}</style>
    </ToolLayout>
  );
}
`;

// ============================================================
// TIMESTAMP CONVERTER
// ============================================================
files['app/tools/timestamp-converter/page.tsx'] = `import type { Metadata } from "next";
import TimestampConverterClient from "./TimestampConverterClient";

export const metadata: Metadata = {
  title: "Unix Timestamp Converter — ToolNinja",
  description: "Convert Unix timestamps to human-readable dates and back. Shows UTC, local time, and relative time.",
};

export default function TimestampConverterPage() {
  return <TimestampConverterClient />;
}
`;

files['app/tools/timestamp-converter/TimestampConverterClient.tsx'] = `"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Clock, RefreshCw } from "lucide-react";

function getRelative(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts);
  const abs = Math.abs(diff);
  const future = diff < 0;
  const units = [
    [60, "second"], [3600, "minute"], [86400, "hour"], [604800, "day"],
    [2592000, "week"], [31536000, "month"],
  ] as [number, string][];
  
  for (let i = units.length - 1; i >= 0; i--) {
    if (abs >= units[i][0]) {
      const val = Math.floor(abs / (i > 0 ? units[i - 1][0] : 1));
      const unit = units[i > 0 ? i - 1 : 0][1];
      const count = Math.floor(abs / (units[i > 0 ? i - 1 : 0][0]));
      const label = count === 1 ? unit : unit + "s";
      return future ? \`in \${count} \${label}\` : \`\${count} \${label} ago\`;
    }
  }
  return "just now";
}

export default function TimestampConverterClient() {
  const [tsInput, setTsInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [tsResult, setTsResult] = useState<{ utc: string; local: string; relative: string; ts: number } | null>(null);
  const [dateResult, setDateResult] = useState<string>("");
  const [tsError, setTsError] = useState("");

  const convertTimestamp = (val: string) => {
    setTsError("");
    const num = Number(val.trim());
    if (isNaN(num)) { setTsResult(null); setTsError("Invalid timestamp"); return; }
    const ms = val.trim().length >= 13 ? num : num * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setTsResult(null); setTsError("Invalid timestamp"); return; }
    const ts = Math.floor(ms / 1000);
    setTsResult({
      utc: d.toUTCString(),
      local: d.toLocaleString(),
      relative: getRelative(ts),
      ts,
    });
  };

  const useNow = () => {
    const now = Math.floor(Date.now() / 1000).toString();
    setTsInput(now);
    convertTimestamp(now);
  };

  const convertDate = () => {
    if (!dateInput) return;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) { setDateResult("Invalid date"); return; }
    setDateResult(Math.floor(d.getTime() / 1000).toString());
  };

  return (
    <ToolLayout title="Timestamp Converter" description="Convert Unix timestamps to human-readable dates">
      <div className="max-w-lg space-y-8">
        {/* Timestamp → Date */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Timestamp → Date
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tsInput}
              onChange={(e) => { setTsInput(e.target.value); convertTimestamp(e.target.value); }}
              placeholder="Unix timestamp (e.g. 1700000000)"
              className={\`flex-1 px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] \${tsError ? "border-[#ef4444]" : "border-[#222222]"}\`}
            />
            <button
              onClick={useNow}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors whitespace-nowrap"
            >
              <RefreshCw size={12} /> Now
            </button>
          </div>
          {tsError && <p className="text-xs text-[#ef4444] mb-2">{tsError}</p>}
          {tsResult && (
            <div className="space-y-2">
              {[
                { label: "UTC", value: tsResult.utc },
                { label: "Local", value: tsResult.local },
                { label: "Relative", value: tsResult.relative },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  <span className="w-14 text-xs text-[#888888] font-medium">{row.label}</span>
                  <span className="flex-1 text-sm text-[#f5f5f5] font-mono">{row.value}</span>
                  <CopyButton text={row.value} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date → Timestamp */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Date → Timestamp
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            <button
              onClick={convertDate}
              className="px-4 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
            >
              Convert
            </button>
          </div>
          {dateResult && (
            <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <span className="text-xs text-[#888888] font-medium">Unix</span>
              <span className="flex-1 text-sm text-[#f5f5f5] font-mono">{dateResult}</span>
              <CopyButton text={dateResult} size="sm" />
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// PASSWORD GENERATOR
// ============================================================
files['app/tools/password-generator/page.tsx'] = `import type { Metadata } from "next";
import PasswordGeneratorClient from "./PasswordGeneratorClient";

export const metadata: Metadata = {
  title: "Password Generator — ToolNinja",
  description: "Generate strong, random passwords with custom length, character sets and strength indicator.",
};

export default function PasswordGeneratorPage() {
  return <PasswordGeneratorClient />;
}
`;

files['app/tools/password-generator/PasswordGeneratorClient.tsx'] = `"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw } from "lucide-react";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function getStrength(pwd: string): { label: string; color: string; width: string } {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "#f97316", width: "66%" };
  return { label: "Strong", color: "#22c55e", width: "100%" };
}

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): string {
  let charset = "";
  if (opts.upper) charset += UPPERCASE;
  if (opts.lower) charset += LOWERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  if (!charset) return "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

export default function PasswordGeneratorClient() {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);

  const generate = () => {
    setPasswords(Array.from({ length: count }, () => generatePassword(length, opts)));
  };

  const toggleOpt = (key: keyof typeof opts) => {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const strength = passwords[0] ? getStrength(passwords[0]) : null;

  return (
    <ToolLayout title="Password Generator" description="Generate strong, random passwords">
      <div className="max-w-lg">
        {/* Length slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#888888] font-medium">Length</label>
            <span className="text-sm font-mono text-[#a855f7] font-semibold">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={(e) => setLength(+e.target.value)}
            className="w-full accent-[#a855f7]"
          />
          <div className="flex justify-between text-xs text-[#555555] mt-1">
            <span>8</span><span>128</span>
          </div>
        </div>

        {/* Character options */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { key: "upper", label: "Uppercase (A-Z)" },
            { key: "lower", label: "Lowercase (a-z)" },
            { key: "numbers", label: "Numbers (0-9)" },
            { key: "symbols", label: "Symbols (!@#...)" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px] cursor-pointer hover:border-[#333333] transition-colors">
              <input
                type="checkbox"
                checked={opts[key as keyof typeof opts]}
                onChange={() => toggleOpt(key as keyof typeof opts)}
                className="accent-[#a855f7]"
              />
              <span className="text-sm text-[#888888]">{label}</span>
            </label>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm text-[#888888]">Generate</label>
          <select
            value={count}
            onChange={(e) => setCount(+e.target.value)}
            className="px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          >
            {[1, 5, 10].map((n) => (
              <option key={n} value={n}>{n} password{n > 1 ? "s" : ""}</option>
            ))}
          </select>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
        </div>

        {/* Strength */}
        {strength && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#888888]">Strength</span>
              <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
            </div>
            <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: strength.width, backgroundColor: strength.color }}
              />
            </div>
          </div>
        )}

        {/* Output */}
        <div className="space-y-2">
          {passwords.map((pwd, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <code className="flex-1 text-sm font-mono text-[#f5f5f5] break-all">{pwd}</code>
              <CopyButton text={pwd} size="sm" />
            </div>
          ))}
          {passwords.length > 1 && (
            <CopyButton text={passwords.join("\\n")} className="w-full justify-center" />
          )}
        </div>

        {passwords.length === 0 && (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create passwords
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// UUID GENERATOR
// ============================================================
files['app/tools/uuid-generator/page.tsx'] = `import type { Metadata } from "next";
import UuidGeneratorClient from "./UuidGeneratorClient";

export const metadata: Metadata = {
  title: "UUID Generator — ToolNinja",
  description: "Generate RFC 4122 version 4 UUIDs in bulk. Copy individual or all at once.",
};

export default function UuidGeneratorPage() {
  return <UuidGeneratorClient />;
}
`;

files['app/tools/uuid-generator/UuidGeneratorClient.tsx'] = `"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw } from "lucide-react";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BULK_OPTIONS = [1, 5, 10, 25, 100];

export default function UuidGeneratorClient() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);

  const generate = () => {
    setUuids(Array.from({ length: count }, generateUUID));
  };

  return (
    <ToolLayout title="UUID Generator" description="Generate RFC 4122 v4 UUIDs in bulk">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888888]">Count:</label>
            <div className="flex">
              {BULK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={\`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors \${
                    count === n
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }\`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
          {uuids.length > 0 && (
            <CopyButton text={uuids.join("\\n")} />
          )}
        </div>

        {uuids.length > 0 ? (
          <div className="space-y-1.5">
            {uuids.map((uuid) => (
              <div key={uuid} className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] group hover:border-[#333333] transition-colors">
                <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{uuid}</code>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={uuid} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create UUIDs
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
`;

// ============================================================
// DIFF CHECKER
// ============================================================
files['app/tools/diff-checker/page.tsx'] = `import type { Metadata } from "next";
import DiffCheckerClient from "./DiffCheckerClient";

export const metadata: Metadata = {
  title: "Diff Checker Online — ToolNinja",
  description: "Compare two text files side by side and see differences highlighted in green and red.",
};

export default function DiffCheckerPage() {
  return <DiffCheckerClient />;
}
`;

files['app/tools/diff-checker/DiffCheckerClient.tsx'] = `"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { diffLines, Change } from "diff";
import { GitCompare } from "lucide-react";

export default function DiffCheckerClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [compared, setCompared] = useState(false);

  const diff = useMemo<Change[]>(() => {
    if (!compared) return [];
    return diffLines(original, modified);
  }, [original, modified, compared]);

  const added = diff.filter((d) => d.added).reduce((s, d) => s + (d.value.split("\\n").length - 1), 0);
  const removed = diff.filter((d) => d.removed).reduce((s, d) => s + (d.value.split("\\n").length - 1), 0);

  return (
    <ToolLayout title="Diff Checker" description="Compare two texts and highlight differences">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Original</label>
          <textarea
            value={original}
            onChange={(e) => { setOriginal(e.target.value); setCompared(false); }}
            placeholder="Paste original text..."
            rows={10}
            className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Modified</label>
          <textarea
            value={modified}
            onChange={(e) => { setModified(e.target.value); setCompared(false); }}
            placeholder="Paste modified text..."
            rows={10}
            className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>
      </div>

      <button
        onClick={() => setCompared(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors mb-4"
      >
        <GitCompare size={14} /> Compare
      </button>

      {/* Summary */}
      {compared && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-[#22c55e]">+{added} lines added</span>
          <span className="text-[#ef4444]">-{removed} lines removed</span>
        </div>
      )}

      {/* Diff output */}
      {compared && diff.length > 0 && (
        <div className="bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto">
          {diff.map((part, i) => {
            const lines = part.value.split("\\n").filter((_, idx, arr) => idx < arr.length - 1 || part.value.endsWith("\\n") ? true : idx < arr.length - 1);
            const bg = part.added ? "bg-[#22c55e]/10" : part.removed ? "bg-[#ef4444]/10" : "";
            const color = part.added ? "text-[#22c55e]" : part.removed ? "text-[#ef4444]" : "text-[#888888]";
            const prefix = part.added ? "+" : part.removed ? "-" : " ";
            return (
              <div key={i} className={bg}>
                {lines.map((line, j) => (
                  <div key={j} className={\`flex items-start px-3 py-0.5 font-mono text-xs \${color}\`}>
                    <span className="w-4 flex-shrink-0 select-none">{prefix}</span>
                    <span className="whitespace-pre-wrap break-all">{line}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {compared && diff.length === 0 && (
        <div className="p-6 text-center text-[#22c55e] border border-[#22c55e]/20 bg-[#22c55e]/5 rounded-[8px]">
          No differences found — texts are identical!
        </div>
      )}

      {!compared && !original && !modified && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste both texts above then click Compare
        </div>
      )}
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
