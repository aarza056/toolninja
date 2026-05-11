"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Code2, Minimize2, Trash2, AlertCircle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const VOID_TAGS = new Set([
  "area","base","br","col","embed","hr","img","input","link",
  "meta","param","source","track","wbr",
]);

// Tags whose inner content must not be touched
const RAW_TAGS = ["pre", "script", "style"];

const PLACEHOLDER_PREFIX = "\x00RAWBLOCK";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>My Page</title><link rel="stylesheet" href="styles.css"></head>
<body><header><h1>Hello World</h1><nav><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li></ul></nav></header><main><p>This is a <strong>sample</strong> HTML document.</p><pre>  keep this\n  indented</pre></main></body>
</html>`;

// ─── Raw-block extraction ─────────────────────────────────────────────────────

function extractRawBlocks(html: string): { html: string; blocks: string[] } {
  const blocks: string[] = [];
  let result = html;
  for (const tag of RAW_TAGS) {
    const re = new RegExp(`(<${tag}[^>]*>)[\\s\\S]*?(<\\/${tag}>)`, "gi");
    result = result.replace(re, (match) => {
      const idx = blocks.length;
      blocks.push(match);
      return `${PLACEHOLDER_PREFIX}${idx}\x00`;
    });
  }
  return { html: result, blocks };
}

function restoreRawBlocks(html: string, blocks: string[]): string {
  return html.replace(
    new RegExp(`${PLACEHOLDER_PREFIX}(\\d+)\x00`, "g"),
    (_, idx) => blocks[parseInt(idx, 10)]
  );
}

// ─── Minifier ────────────────────────────────────────────────────────────────

export function minifyHtml(html: string): string {
  const { html: extracted, blocks } = extractRawBlocks(html);

  const result = extracted
    // Remove HTML comments (but not IE conditionals)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    // Collapse whitespace between tags
    .replace(/>\s+</g, "><")
    // Strip leading/trailing whitespace from each line
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("");

  return restoreRawBlocks(result, blocks);
}

// ─── Prettifier ──────────────────────────────────────────────────────────────

export function prettifyHtml(html: string, indent: number): string {
  const { html: extracted, blocks } = extractRawBlocks(html);
  const pad = " ".repeat(indent);
  const lines: string[] = [];
  let level = 0;

  // Tokenise into tags and text
  const TOKEN_RE = /(<[^>]+>)|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = TOKEN_RE.exec(extracted)) !== null) {
    const [, tag, text] = m;

    if (text !== undefined) {
      const t = text.trim();
      if (t) lines.push(pad.repeat(level) + t);
      continue;
    }

    if (!tag) continue;

    // Doctype / processing instructions — emit as-is at level 0
    if (/^<!/i.test(tag) || /^<\?/.test(tag)) {
      lines.push(pad.repeat(level) + tag);
      continue;
    }

    // Closing tag
    const closingMatch = tag.match(/^<\/([a-z][a-z0-9]*)/i);
    if (closingMatch) {
      level = Math.max(0, level - 1);
      lines.push(pad.repeat(level) + tag);
      continue;
    }

    // Opening tag (possibly self-closing with />)
    const openingMatch = tag.match(/^<([a-z][a-z0-9]*)/i);
    if (openingMatch) {
      const tagName = openingMatch[1].toLowerCase();
      const isSelfClosing = tag.endsWith("/>") || VOID_TAGS.has(tagName);
      lines.push(pad.repeat(level) + tag);
      if (!isSelfClosing) {
        level++;
      }
      continue;
    }

    // Fallback: emit as-is
    lines.push(pad.repeat(level) + tag);
  }

  const result = lines.join("\n");
  return restoreRawBlocks(result, blocks);
}

// ─── Main component ──────────────────────────────────────────────────────────

type Mode = "prettify" | "minify";

export default function HtmlFormatterClient() {
  const [input, setInput] = useState(SAMPLE_HTML);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("prettify");
  const [indentSize, setIndentSize] = useState<2 | 4>(2);

  const run = useCallback(
    (html: string, m: Mode, indent: 2 | 4) => {
      if (!html.trim()) {
        setOutput("");
        setError("");
        return;
      }
      try {
        const result =
          m === "prettify" ? prettifyHtml(html, indent) : minifyHtml(html);
        setOutput(result);
        setError("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Processing failed");
        setOutput("");
      }
    },
    []
  );

  const handleInput = (value: string) => {
    setInput(value);
    run(value, mode, indentSize);
  };

  const handleMode = (m: Mode) => {
    setMode(m);
    run(input, m, indentSize);
  };

  const handleIndent = (n: 2 | 4) => {
    setIndentSize(n);
    if (mode === "prettify") run(input, mode, n);
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <ToolLayout title="HTML Formatter" description="Prettify or minify HTML with smart raw-block preservation">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => handleMode("prettify")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] transition-colors ${
            mode === "prettify"
              ? "bg-[#a855f7] hover:bg-[#9333ea] text-white"
              : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222]"
          }`}
        >
          <Code2 size={14} /> Prettify
        </button>
        <button
          onClick={() => handleMode("minify")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] transition-colors ${
            mode === "minify"
              ? "bg-[#a855f7] hover:bg-[#9333ea] text-white"
              : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222]"
          }`}
        >
          <Minimize2 size={14} /> Minify
        </button>

        {/* Indent size — only relevant for prettify */}
        {mode === "prettify" && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-[#888888]">Indent:</span>
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              {([2, 4] as (2 | 4)[]).map((n) => (
                <button
                  key={n}
                  onClick={() => handleIndent(n)}
                  className={`px-2.5 py-1 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                    indentSize === n
                      ? "bg-[#a855f7] text-white"
                      : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col gap-1 min-h-0">
          <label className="text-xs text-[#888888] font-medium">HTML Input</label>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Paste or type your HTML here..."
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col gap-1 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">
              {mode === "prettify" ? "Prettified" : "Minified"}
            </label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <div className="flex-1 overflow-auto bg-[#111111] border border-[#222222] rounded-[8px] p-3 min-h-0">
            {output ? (
              <pre className="font-mono text-sm text-[#f5f5f5] leading-relaxed m-0 p-0 bg-transparent whitespace-pre-wrap break-words">
                {output}
              </pre>
            ) : (
              <p className="text-[#444444] text-sm italic">
                {error
                  ? "Fix the error to see output"
                  : "Output will appear here..."}
              </p>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
