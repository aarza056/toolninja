"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { ArrowLeftRight, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:html-entity";

type Mode = "encode" | "decode";
type EncodingStyle = "named" | "numeric" | "hex";
type EncodingScope = "special" | "all";

// Named entity map for encode-special-only mode
const NAMED_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const NUMERIC_MAP: Record<string, string> = {
  "&": "&#38;",
  "<": "&#60;",
  ">": "&#62;",
  '"': "&#34;",
  "'": "&#39;",
};

const HEX_MAP: Record<string, string> = {
  "&": "&#x26;",
  "<": "&#x3C;",
  ">": "&#x3E;",
  '"': "&#x22;",
  "'": "&#x27;",
};

function encodeHtml(
  text: string,
  style: EncodingStyle,
  scope: EncodingScope
): string {
  if (scope === "special") {
    const map = style === "named" ? NAMED_MAP : style === "numeric" ? NUMERIC_MAP : HEX_MAP;
    return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
  }

  // Encode all: first escape special chars, then encode non-ASCII
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = text.codePointAt(i)!;

    if (ch === "&" || ch === "<" || ch === ">" || ch === '"' || ch === "'") {
      const map = style === "named" ? NAMED_MAP : style === "numeric" ? NUMERIC_MAP : HEX_MAP;
      result += map[ch];
    } else if (code > 127) {
      if (style === "named") {
        // Named entities for common characters; fall back to numeric for the rest
        result += `&#${code};`;
      } else if (style === "numeric") {
        result += `&#${code};`;
      } else {
        result += `&#x${code.toString(16).toUpperCase()};`;
      }
      // Skip surrogate pair second char if needed
      if (code > 0xffff) i++;
    } else {
      result += ch;
    }
  }
  return result;
}

function decodeHtml(text: string): string {
  // Use a textarea trick — works only in browser
  if (typeof document === "undefined") return text;
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent ?? div.innerText ?? "";
}

export default function HtmlEntityClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [encodingStyle, setEncodingStyle] = useState<EncodingStyle>("named");
  const [encodingScope, setEncodingScope] = useState<EncodingScope>("special");
  const [error, setError] = useState("");

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.input) setInput(d.input);
        if (d.mode) setMode(d.mode);
        if (d.encodingStyle) setEncodingStyle(d.encodingStyle);
        if (d.encodingScope) setEncodingScope(d.encodingScope);
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, mode, encodingStyle, encodingScope }));
    } catch {}
  }, [input, mode, encodingStyle, encodingScope]);

  const convert = useCallback(
    (text: string, m: Mode, style: EncodingStyle, scope: EncodingScope) => {
      setError("");
      if (!text) {
        setOutput("");
        return;
      }
      try {
        if (m === "encode") {
          setOutput(encodeHtml(text, style, scope));
        } else {
          setOutput(decodeHtml(text));
        }
      } catch {
        setError("Conversion failed. Check your input.");
        setOutput("");
      }
    },
    []
  );

  // Re-run conversion whenever any relevant state changes
  useEffect(() => {
    convert(input, mode, encodingStyle, encodingScope);
  }, [input, mode, encodingStyle, encodingScope, convert]);

  const handleSwap = () => {
    setInput(output);
    setOutput("");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const setModeAndConvert = (m: Mode) => {
    setMode(m);
    convert(input, m, encodingStyle, encodingScope);
  };

  return (
    <ToolLayout
      title="HTML Entity Encoder / Decoder"
      description="Encode and decode HTML entities and special characters. Supports named, numeric, and hex formats."
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Mode toggle */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1.5">Mode</label>
          <div className="flex">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setModeAndConvert(m)}
                className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors capitalize ${
                  mode === m
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {m === "encode" ? "Encode" : "Decode"}
              </button>
            ))}
          </div>
        </div>

        {/* Encoding style — only shown in encode mode */}
        {mode === "encode" && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Entity Style</label>
            <div className="flex">
              {(["named", "numeric", "hex"] as EncodingStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setEncodingStyle(s)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    encodingStyle === s
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {s === "named" ? "Named" : s === "numeric" ? "Numeric" : "Hex"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Encoding scope — only in encode mode */}
        {mode === "encode" && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Scope</label>
            <div className="flex">
              {(["special", "all"] as EncodingScope[]).map((sc) => (
                <button
                  key={sc}
                  onClick={() => setEncodingScope(sc)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    encodingScope === sc
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {sc === "special" ? "Special Only" : "Encode All"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-end gap-2 ml-auto">
          <button
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-[22px]"
          >
            <ArrowLeftRight size={14} /> Swap
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors mt-[22px]"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Hint for encoding style */}
      {mode === "encode" && (
        <p className="text-xs text-[#555555] mb-4">
          {encodingStyle === "named"
            ? 'Named entities — e.g. &amp; &lt; &gt; &quot;'
            : encodingStyle === "numeric"
            ? "Numeric entities — e.g. &#38; &#60; &#62; &#34;"
            : "Hex entities — e.g. &#x26; &#x3C; &#x3E; &#x22;"}
          {encodingScope === "special"
            ? " · Encodes only < > & \" '"
            : " · Encodes all non-ASCII characters too"}
        </p>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-320px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? 'Enter HTML or plain text to encode, e.g. <script>alert("hi")</script>'
                : "Enter HTML entities to decode, e.g. &lt;div&gt;"
            }
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Output</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <div className="relative flex-1">
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here as you type..."
              className="absolute inset-0 w-full h-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none placeholder:text-[#444444]"
              spellCheck={false}
            />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {input && (
        <div className="flex gap-4 mt-3 text-xs text-[#555555]">
          <span>
            Input: <span className="text-[#888888]">{input.length} chars</span>
          </span>
          {output && (
            <span>
              Output: <span className="text-[#888888]">{output.length} chars</span>
            </span>
          )}
          {output && input.length > 0 && (
            <span>
              Ratio:{" "}
              <span className="text-[#888888]">
                {((output.length / input.length) * 100).toFixed(0)}%
              </span>
            </span>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
