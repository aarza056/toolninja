"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { extractHeadings, buildTocMarkdown, buildTocHtml } from "@/lib/markdown-toc";

const STORAGE_KEY = "toolninja:markdown-toc-generator";

const EXAMPLE = `# Getting Started

## Installation

## Configuration

### Environment Variables

### Config File

## Usage

### Basic Example

### Advanced Example

## Troubleshooting

## FAQ`;

type Format = "markdown" | "html";

export default function MarkdownTocGeneratorClient() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<Format>("markdown");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const headings = useMemo(() => extractHeadings(input), [input]);
  const toc = useMemo(
    () => (format === "markdown" ? buildTocMarkdown(headings) : buildTocHtml(headings)),
    [headings, format]
  );

  return (
    <ToolLayout
      title="Markdown Table of Contents Generator"
      description="Paste markdown headings and get an anchor-linked table of contents — GitHub-style slugs, nested by heading level"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Markdown document</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="# Title&#10;## Section&#10;### Subsection"
            spellCheck={false}
            className="w-full h-[480px] p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              Table of contents {headings.length > 0 && `(${headings.length} headings)`}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                <button
                  onClick={() => setFormat("markdown")}
                  className={`px-2.5 py-1 text-xs transition-colors ${format === "markdown" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setFormat("html")}
                  className={`px-2.5 py-1 text-xs border-l border-[#222222] transition-colors ${format === "html" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
                >
                  HTML
                </button>
              </div>
              {toc && <CopyButton text={toc} size="sm" />}
            </div>
          </div>
          {toc ? (
            <textarea
              value={toc}
              readOnly
              spellCheck={false}
              className="w-full h-[480px] p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none"
            />
          ) : (
            <div className="h-[480px] p-8 flex items-center justify-center text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
              Add some # headings to generate a table of contents
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Anchors are slugified the same way GitHub renders them: lowercased, punctuation stripped,
        spaces turned into hyphens, and a numeric suffix added for any duplicate heading text — so
        pasting this straight into a GitHub README&apos;s existing headings should produce working
        links without edits. Headings inside fenced code blocks are ignored.
      </div>
    </ToolLayout>
  );
}
