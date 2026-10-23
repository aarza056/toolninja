"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Columns, FileText, Eye, Download, Printer, List } from "lucide-react";

const STORAGE_KEY = "toolninja:markdown-preview";

type ViewMode = "split" | "editor" | "preview";

const DEFAULT_MD = `---
title: Hello, ToolNinja!
author: Developer
date: 2025-01-01
---

# Hello, ToolNinja!

This is a **live Markdown preview** with frontmatter support.

## Features
- Real-time rendering
- GFM support (tables, strikethrough, etc.)
- Frontmatter metadata detection
- Word count & reading time

## Code Example

\`\`\`typescript
const greet = (name: string) => \`Hello, \${name}!\`;
console.log(greet("World"));
\`\`\`

## Table

| Tool | Category | Description |
|------|----------|-------------|
| JSON Formatter | Format | Format JSON |
| Base64 | Encode | Encode/Decode |
| Regex Tester | Test | Test patterns |

> Your data never leaves the browser 🔒
`;

function parseFrontmatter(content: string): {
  meta: Record<string, string> | null;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: null, body: content };
  try {
    const lines = match[1].split("\n").filter(Boolean);
    const meta: Record<string, string> = {};
    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim();
      meta[key] = val;
    }
    return { meta: Object.keys(meta).length > 0 ? meta : null, body: match[2] };
  } catch {
    return { meta: null, body: content };
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Extracts headings in document order and assigns each the same slug id GitHub-style
 * renderers use (lowercased, hyphenated, de-duplicated with a -1, -2… suffix). Skips
 * headings that fall inside fenced code blocks. */
function extractToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const seen = new Map<string, number>();
  const toc: TocEntry[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/\s+#+\s*$/, "").trim();
    const base = slugify(text) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    toc.push({ level, text, id: count > 0 ? `${base}-${count}` : base });
  }

  return toc;
}

export default function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [view, setView] = useState<ViewMode>("split");
  const [showToc, setShowToc] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const headingCounterRef = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMarkdown(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, markdown);
    } catch {}
  }, [markdown]);

  const { meta, body } = useMemo(() => parseFrontmatter(markdown), [markdown]);
  const wordCount = useMemo(() => countWords(body), [body]);
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const toc = useMemo(() => extractToc(body), [body]);

  // Reset before each render pass so the custom heading components below can pull the
  // matching precomputed id by document order, keeping TOC links and rendered ids in sync.
  headingCounterRef.current = 0;
  const headingComponents = useMemo(() => {
    const makeHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      const Tag = `h${level}` as const;
      return function Heading({ children }: { children?: React.ReactNode }) {
        const entry = toc[headingCounterRef.current];
        headingCounterRef.current++;
        return <Tag id={entry?.id}>{children}</Tag>;
      };
    };
    return {
      h1: makeHeading(1),
      h2: makeHeading(2),
      h3: makeHeading(3),
      h4: makeHeading(4),
      h5: makeHeading(5),
      h6: makeHeading(6),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const el = previewRef.current?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const buildExportHtml = (forPrint: boolean) => {
    if (!previewRef.current) return "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta?.title ?? "Exported Markdown"}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.6; }
  h1,h2,h3,h4 { margin-top: 1.5em; }
  code { background: #f5f5f5; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f5f5f5; }
  blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
  img { max-width: 100%; }
  ${forPrint ? "@media print { body { padding: 0; max-width: none; } }" : ""}
</style>
</head>
<body>
${previewRef.current.innerHTML}
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const html = buildExportHtml(false);
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta?.title?.toLowerCase().replace(/\s+/g, "-") ?? "export"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const html = buildExportHtml(true);
    if (!html) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const showEditor = view === "split" || view === "editor";
  const showPreview = view === "split" || view === "preview";

  return (
    <ToolLayout title="Markdown Preview" description="Write and preview Markdown with frontmatter support and export">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* View mode toggle */}
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setView("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "split" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <Columns size={13} /> Split
          </button>
          <button
            onClick={() => setView("editor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${view === "editor" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <FileText size={13} /> Editor
          </button>
          <button
            onClick={() => setView("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${view === "preview" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            <Eye size={13} /> Preview
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[#555555] ml-1">
          <span>{wordCount} words</span>
          <span>{readingTime} min read</span>
        </div>

        {toc.length > 0 && (
          <button
            onClick={() => setShowToc((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
              showToc ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
            }`}
          >
            <List size={13} /> Contents
          </button>
        )}

        {/* Export */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Printer size={13} /> Export PDF
          </button>
          <button
            onClick={handleExportHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Download size={13} /> Export HTML
          </button>
        </div>
      </div>

      {/* Frontmatter metadata table */}
      {meta && (
        <div className="mb-4 border border-[#222222] rounded-[8px] overflow-hidden">
          <div className="px-3 py-2 bg-[#0d0d0d] border-b border-[#222222]">
            <span className="text-xs text-[#555555] font-medium">Frontmatter</span>
          </div>
          <table className="w-full text-xs font-mono">
            <tbody>
              {Object.entries(meta).map(([k, v]) => (
                <tr key={k} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="px-3 py-1.5 text-[#a855f7] w-32">{k}</td>
                  <td className="px-3 py-1.5 text-[#888888]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor / Preview panels */}
      <div className={`flex gap-4 h-[calc(100vh-${meta ? "340px" : "280px"})] min-h-[400px]`}>
        {/* Table of contents sidebar */}
        {showToc && toc.length > 0 && showPreview && (
          <div className="hidden lg:flex flex-col gap-1 w-[220px] shrink-0">
            <label className="text-xs text-[#888888] font-medium">Contents</label>
            <div className="flex-1 overflow-auto p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <nav className="space-y-1.5">
                {toc.map((entry, i) => (
                  <button
                    key={`${entry.id}-${i}`}
                    onClick={() => scrollToHeading(entry.id)}
                    style={{ paddingLeft: `${(entry.level - 1) * 12}px` }}
                    className="block w-full text-left text-xs text-[#888888] hover:text-[#a855f7] transition-colors truncate"
                  >
                    {entry.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div
          className={`gap-4 flex-1 min-w-0 ${
            view === "split" ? "grid grid-cols-1 md:grid-cols-2" : "flex"
          }`}
        >
          {/* Editor */}
          {showEditor && (
            <div className={`flex flex-col gap-1 ${view !== "split" ? "flex-1" : ""}`}>
              <label className="text-xs text-[#888888] font-medium">Markdown</label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div className={`flex flex-col gap-1 ${view !== "split" ? "flex-1" : ""}`}>
              <label className="text-xs text-[#888888] font-medium">Preview</label>
              <div
                ref={previewRef}
                className="flex-1 overflow-auto p-4 bg-[#111111] border border-[#222222] rounded-[8px] prose prose-invert prose-sm max-w-none"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={headingComponents}>{body}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
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
      `}</style>
    </ToolLayout>
  );
}
