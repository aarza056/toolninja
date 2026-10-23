"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Upload, Download } from "lucide-react";
import { simulateImageData, COLOR_BLINDNESS_TYPES, type ColorBlindnessType } from "@/lib/color-blindness";

function renderVariant(img: HTMLImageElement, type: ColorBlindnessType | "original"): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  if (type !== "original") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(simulateImageData(imageData, type), 0, 0);
  }
  return canvas.toDataURL("image/png");
}

export default function ColorBlindnessSimulatorClient() {
  const [imageSrc, setImageSrc] = useState("");
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<ColorBlindnessType>("deuteranomaly");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const renderAll = useCallback((img: HTMLImageElement) => {
    const result: Record<string, string> = { original: renderVariant(img, "original") };
    for (const t of COLOR_BLINDNESS_TYPES) result[t.id] = renderVariant(img, t.id);
    setVariants(result);
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
          renderAll(img);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [renderAll]
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

  const downloadVariant = (type: string) => {
    const src = variants[type];
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `${type}.png`;
    a.click();
  };

  const selectedMeta = COLOR_BLINDNESS_TYPES.find((t) => t.id === selected);

  return (
    <ToolLayout
      title="Color Blindness Simulator"
      description="Upload an image and see exactly how it looks under 7 types of color vision deficiency"
    >
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-1.5">
              {COLOR_BLINDNESS_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`px-2.5 py-1.5 text-xs rounded-[6px] border transition-colors ${
                    selected === t.id
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setImageSrc(""); setVariants({}); imgElRef.current = null; }}
              className="text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors shrink-0"
            >
              Use a different image
            </button>
          </div>

          {selectedMeta && (
            <p className="text-xs text-[#666666] mb-4">
              {selectedMeta.description} — affects roughly {selectedMeta.prevalence}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">Original</label>
              </div>
              <div className="rounded-[8px] overflow-hidden border border-[#222222] bg-[#0a0a0a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={variants.original || imageSrc} alt="Original" className="w-full max-h-96 object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">{selectedMeta?.label}</label>
                <button
                  onClick={() => downloadVariant(selected)}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              </div>
              <div className="rounded-[8px] overflow-hidden border border-[#222222] bg-[#0a0a0a]">
                {variants[selected] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={variants[selected]} alt={selectedMeta?.label} className="w-full max-h-96 object-contain" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
