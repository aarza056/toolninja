"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { ArrowRightLeft, AlertTriangle, ArrowRight } from "lucide-react";
import { cssToXPath, xpathToCss } from "@/lib/css-xpath-convert";

const STORAGE_KEY = "toolninja:css-xpath-converter";

type Direction = "css-to-xpath" | "xpath-to-css";

const EXAMPLES: { label: string; css: string }[] = [
  { label: "ID + class", css: "#nav .active" },
  { label: "Attribute", css: "a[href^='https']" },
  { label: "Child combinator", css: "ul > li" },
  { label: "Multiple classes", css: ".card.featured" },
  { label: "nth-child", css: "li:nth-child(2)" },
];

export default function CssXpathConverterClient() {
  const [direction, setDirection] = useState<Direction>("css-to-xpath");
  const [input, setInput] = useState("#nav .active");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.input) setInput(parsed.input);
        if (parsed.direction) setDirection(parsed.direction);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, direction }));
    } catch {}
  }, [input, direction]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return {
        output: direction === "css-to-xpath" ? cssToXPath(input) : xpathToCss(input),
        error: "",
      };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Conversion failed" };
    }
  }, [input, direction]);

  const flip = () => {
    setDirection((d) => (d === "css-to-xpath" ? "xpath-to-css" : "css-to-xpath"));
    if (output) setInput(output);
  };

  return (
    <ToolLayout
      title="CSS Selector ↔ XPath Converter"
      description="Convert between CSS selectors and XPath expressions for the common patterns both languages share"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className={direction === "css-to-xpath" ? "text-[#f5f5f5] font-medium" : "text-[#555555]"}>CSS</span>
          <button
            onClick={flip}
            className="p-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#222222] rounded-[6px] text-[#a855f7] transition-colors"
            title="Swap direction"
          >
            <ArrowRightLeft size={14} />
          </button>
          <span className={direction === "xpath-to-css" ? "text-[#f5f5f5] font-medium" : "text-[#555555]"}>XPath</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">{direction === "css-to-xpath" ? "CSS selector" : "XPath expression"}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === "css-to-xpath" ? "#nav .active" : "//*[@id='nav']//*[contains(concat(' ', normalize-space(@class), ' '), ' active ')]"}
            spellCheck={false}
            className="h-32 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />

          <div className="mt-2">
            <p className="text-[10px] text-[#555555] mb-2">Examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => { setDirection("css-to-xpath"); setInput(ex.css); }}
                  className="text-[11px] px-2 py-1 bg-[#111111] border border-[#222222] rounded-[4px] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors font-mono"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">{direction === "css-to-xpath" ? "XPath" : "CSS selector"}</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <div className="h-32 p-3 bg-[#0d0d0d] border border-[#222222] rounded-[8px] overflow-auto">
            {error ? (
              <div className="flex items-start gap-2 text-xs text-[#ef4444]">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}
              </div>
            ) : output ? (
              <code className="text-sm font-mono text-[#f5f5f5] break-all whitespace-pre-wrap">{output}</code>
            ) : (
              <span className="text-sm text-[#444444]">Result will appear here…</span>
            )}
          </div>

          {direction === "css-to-xpath" && output && !error && (
            <Link
              href={`/tools/xpath-tester`}
              className="inline-flex items-center gap-1 mt-2 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors w-fit"
            >
              Test this in XPath Tester <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Supports tag/#id/.class/[attr] selectors, the space/<code className="text-[#e879f9]">&gt;</code>/<code className="text-[#e879f9]">+</code>/<code className="text-[#e879f9]">~</code> combinators,
        and <code className="text-[#e879f9]">:first-child</code>, <code className="text-[#e879f9]">:last-child</code>, <code className="text-[#e879f9]">:nth-child(n)</code>.
        Dynamic pseudo-classes (<code className="text-[#e879f9]">:hover</code>, <code className="text-[#e879f9]">:not()</code>) have no XPath equivalent and
        aren&apos;t supported. XPath → CSS only reverses patterns this converter itself produces — XPath using other axes
        (<code className="text-[#e879f9]">ancestor::</code>, <code className="text-[#e879f9]">parent::</code>) or functions like <code className="text-[#e879f9]">text()</code> generally
        has no CSS equivalent at all, since CSS can&apos;t select by text content or move upward in the tree.
      </div>
    </ToolLayout>
  );
}
