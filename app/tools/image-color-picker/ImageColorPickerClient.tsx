"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Upload } from "lucide-react";
import { extractColors, type ExtractedColor } from "@/lib/color-extractor";

export default function ImageColorPickerClient() {
  const [imageSrc, setImageSrc] = useState("");
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [count, setCount] = useState(6);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const runExtract = useCallback((img: HTMLImageElement, n: number) => {
    setColors(extractColors(img, n));
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result ?? "");
        setImageSrc(src);
        const img = new Image();
        img.onload = () => {
          imgElRef.current = img;
          runExtract(img, count);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [count, runExtract]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) loadFile(f);
  };

  const updateCount = (n: number) => {
    setCount(n);
    if (imgElRef.current) runExtract(imgElRef.current, n);
  };

  const cssVars = colors
    .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    .join("\n");
  const cssVarsBlock = colors.length ? `:root {\n${cssVars}\n}` : "";

  return (
    <ToolLayout title="Image Color Palette Extractor" description="Pull the dominant colors out of any image — hex, RGB, and CSS variables">
      {!imageSrc ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors ${
            dragOver ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#222222] hover:border-[#333333]"
          }`}
        >
          <Upload size={40} strokeWidth={1} className="text-[#444444]" />
          <p className="text-sm text-[#888888]">Drag & drop an image, or click to upload</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          <div>
            <div className="relative rounded-[8px] overflow-hidden border border-[#222222] bg-[#0a0a0a] mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="Uploaded" className="w-full max-h-80 object-contain" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#888888]">Colors:</label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={count}
                  onChange={(e) => updateCount(Number(e.target.value))}
                  className="w-32 accent-[#a855f7]"
                />
                <span className="text-xs font-mono text-[#a855f7]">{count}</span>
              </div>
              <button
                onClick={() => { setImageSrc(""); setColors([]); }}
                className="text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                Use a different image
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <div key={c.hex} className="rounded-[8px] overflow-hidden border border-[#222222]">
                  <div className="h-16" style={{ backgroundColor: c.hex }} />
                  <div className="p-2 bg-[#111111] flex items-center justify-between">
                    <code className="text-xs font-mono text-[#f5f5f5]">{c.hex}</code>
                    <CopyButton text={c.hex} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Extracted colors</label>
            <div className="space-y-1.5 mb-4">
              {colors.map((c) => (
                <div key={c.hex} className="flex items-center gap-3 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px]">
                  <div className="w-6 h-6 rounded shrink-0 border border-[#333333]" style={{ backgroundColor: c.hex }} />
                  <code className="text-sm font-mono text-[#f5f5f5]">{c.hex}</code>
                  <code className="text-xs font-mono text-[#666666]">rgb({c.rgb.join(", ")})</code>
                  <span className="text-xs text-[#555555] ml-auto">{Math.round(c.population * 100)}%</span>
                  <CopyButton text={c.hex} size="sm" />
                </div>
              ))}
            </div>

            {cssVarsBlock && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#888888] font-medium">CSS Variables</label>
                  <CopyButton text={cssVarsBlock} size="sm" />
                </div>
                <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#a855f7] overflow-auto">
                  {cssVarsBlock}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
