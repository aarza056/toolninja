"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Upload, Download, TrendingDown } from "lucide-react";
import { optimizeSvg, svgByteSize, DEFAULT_SVG_OPTIONS, type SvgOptimizeOptions } from "@/lib/svg-optimizer";

const STORAGE_KEY = "toolninja:svg-optimizer";

function toDataUri(svg: string): string {
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    return "";
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

const OPTION_LABELS: { key: keyof SvgOptimizeOptions; label: string }[] = [
  { key: "removeComments", label: "Remove comments" },
  { key: "removeMetadata", label: "Remove metadata, title, desc" },
  { key: "removeEditorData", label: "Remove editor data (Inkscape/Sodipodi)" },
  { key: "removeEmptyGroups", label: "Remove empty groups" },
  { key: "removeDimensions", label: "Remove width/height (keep viewBox)" },
  { key: "minifyWhitespace", label: "Minify whitespace" },
];

export default function SvgOptimizerClient() {
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState("image.svg");
  const [opts, setOpts] = useState<SvgOptimizeOptions>(DEFAULT_SVG_OPTIONS);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const output = useMemo(() => (input.trim() ? optimizeSvg(input, opts) : ""), [input, opts]);
  const originalSize = svgByteSize(input);
  const optimizedSize = svgByteSize(output);
  const reduction = originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 100) : 0;

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result ?? ""));
    reader.readAsText(file);
    setFileName(file.name);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const toggleOpt = (key: keyof SvgOptimizeOptions) => {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const download = () => {
    const blob = new Blob([output], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.svg$/i, "") + ".min.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout title="SVG Optimizer" description="Strip editor cruft and shrink SVG file size — entirely in your browser">
      {!input ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed rounded-[8px] transition-colors ${
            dragOver ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#222222]"
          }`}
        >
          <Upload size={36} strokeWidth={1} className="text-[#444444]" />
          <p className="text-sm text-[#888888]">Drag & drop an .svg file, or paste SVG markup below</p>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors cursor-pointer">
            Choose file
            <input type="file" accept=".svg,image/svg+xml" onChange={handleFileInput} className="hidden" />
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
            rows={6}
            spellCheck={false}
            className="w-full mt-2 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      ) : (
        <>
          {/* Size comparison */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <div className="text-sm">
              <span className="text-[#555555]">Original: </span>
              <span className="font-mono text-[#888888]">{formatBytes(originalSize)}</span>
            </div>
            <div className="text-sm">
              <span className="text-[#555555]">Optimized: </span>
              <span className="font-mono text-[#22c55e]">{formatBytes(optimizedSize)}</span>
            </div>
            {reduction > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] rounded-full">
                <TrendingDown size={12} /> {reduction}% smaller
              </span>
            )}
            <button
              onClick={() => setInput("")}
              className="ml-auto text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
            >
              Use a different file
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-3 mb-4">
            {OPTION_LABELS.map((o) => (
              <label key={o.key} className="flex items-center gap-1.5 text-xs text-[#888888]">
                <input type="checkbox" checked={opts[o.key] as boolean} onChange={() => toggleOpt(o.key)} className="accent-[#a855f7]" />
                {o.label}
              </label>
            ))}
            <label className="flex items-center gap-1.5 text-xs text-[#888888]">
              Precision:
              <input
                type="number"
                min={0}
                max={4}
                value={opts.precision}
                onChange={(e) => setOpts((prev) => ({ ...prev, precision: Number(e.target.value) }))}
                className="w-12 px-1.5 py-0.5 bg-[#111111] border border-[#222222] rounded text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
              decimals
            </label>
          </div>

          {/* Previews */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col items-center gap-2 p-4 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <span className="text-[10px] text-[#555555] uppercase tracking-wide">Original</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toDataUri(input)} alt="Original SVG" className="max-w-full max-h-32" />
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <span className="text-[10px] text-[#555555] uppercase tracking-wide">Optimized</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toDataUri(output)} alt="Optimized SVG" className="max-w-full max-h-32" />
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">Optimized SVG</label>
              <div className="flex items-center gap-2">
                <button onClick={download} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
                  <Download size={12} /> Download
                </button>
                <CopyButton text={output} size="sm" />
              </div>
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-72 whitespace-pre-wrap break-all">
              {output}
            </pre>
          </div>
        </>
      )}
    </ToolLayout>
  );
}
