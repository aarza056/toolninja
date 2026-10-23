"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { svgToJsx } from "@/lib/svg-to-jsx";
import { AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:svg-to-jsx";

const EXAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 3h18v18H3z" fill-rule="evenodd" />
  <circle cx="12" cy="12" r="5" />
</svg>`;

export default function SvgToJsxClient() {
  const [input, setInput] = useState("");
  const [componentName, setComponentName] = useState("Icon");
  const [typescript, setTypescript] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setInput(parsed.input ?? EXAMPLE);
        setComponentName(parsed.componentName ?? "Icon");
        setTypescript(parsed.typescript ?? true);
      } else {
        setInput(EXAMPLE);
      }
    } catch {
      setInput(EXAMPLE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, componentName, typescript }));
    } catch {}
  }, [input, componentName, typescript]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: svgToJsx(input, componentName, typescript), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Conversion failed" };
    }
  }, [input, componentName, typescript]);

  const previewSrc = input.trim() && !error
    ? `data:image/svg+xml;utf8,${encodeURIComponent(input)}`
    : null;

  const inputClass =
    "px-3 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="SVG to JSX / React Component"
      description="Paste raw SVG markup and get a ready-to-use React component"
    >
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Component name</label>
          <input
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            spellCheck={false}
            className={`${inputClass} w-40`}
          />
        </div>
        <div className="flex">
          <button
            onClick={() => setTypescript(true)}
            className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
              typescript ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setTypescript(false)}
            className={`px-3 py-1.5 text-sm border border-l-0 last:rounded-r-[6px] transition-colors ${
              !typescript ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
            }`}
          >
            JavaScript
          </button>
        </div>
        {previewSrc && (
          <div className="flex items-center gap-2 ml-auto p-2 bg-[#111111] border border-[#222222] rounded-[6px]">
            <span className="text-[10px] text-[#555555]">Preview</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="SVG preview" className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">SVG markup</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste SVG markup here…"
            rows={14}
            spellCheck={false}
            className={`w-full p-3 font-mono text-xs resize-y bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              {componentName || "Icon"}.{typescript ? "tsx" : "jsx"}
            </label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className="w-full h-[calc(100%-28px)] min-h-[300px] p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
            {output || <span className="text-[#444444] italic">Component will appear here…</span>}
          </pre>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        data-* and aria-* attributes are kept exactly as written (JSX special-cases them); everything
        else is converted to camelCase (stroke-width → strokeWidth, xlink:href → xlinkHref). The root
        &lt;svg&gt; spreads {"{...props}"} so size, color, and event handlers stay overridable by the caller.
      </div>
    </ToolLayout>
  );
}
