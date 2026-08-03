"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Upload, Download, TrendingDown } from "lucide-react";
import { loadImage, compressImage, formatBytes, type OutputFormat } from "@/lib/image-compressor";

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "image/jpeg", label: "JPEG" },
  { id: "image/webp", label: "WebP" },
  { id: "image/png", label: "PNG" },
];

export default function ImageCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDims, setResultDims] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (f: File) => {
    setFile(f);
    const img = await loadImage(f);
    setImage(img);
    setMaxWidth(img.naturalWidth);
    await runCompress(img, format, quality, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCompress = useCallback(
    async (img: HTMLImageElement, fmt: OutputFormat, q: number, maxW: number) => {
      setBusy(true);
      try {
        const result = await compressImage(img, {
          format: fmt,
          quality: q / 100,
          maxWidth: maxW > 0 ? maxW : undefined,
        });
        setResultBlob(result.blob);
        setResultDims({ width: result.width, height: result.height });
        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(result.blob);
        });
      } finally {
        setBusy(false);
      }
    },
    []
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

  const updateFormat = (fmt: OutputFormat) => {
    setFormat(fmt);
    if (image) runCompress(image, fmt, quality, maxWidth === image.naturalWidth ? 0 : maxWidth);
  };

  const updateQuality = (q: number) => {
    setQuality(q);
    if (image) runCompress(image, format, q, maxWidth === image.naturalWidth ? 0 : maxWidth);
  };

  const updateMaxWidth = (w: number) => {
    setMaxWidth(w);
    if (image) runCompress(image, format, quality, w === image.naturalWidth ? 0 : w);
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const ext = format.split("/")[1];
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + `-compressed.${ext}`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setImage(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setResultBlob(null);
  };

  const originalSize = file?.size ?? 0;
  const compressedSize = resultBlob?.size ?? 0;
  const reduction = originalSize > 0 && compressedSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <ToolLayout title="Image Compressor" description="Compress and resize JPEG, PNG, and WebP images — entirely in your browser">
      {!file ? (
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
          <p className="text-xs text-[#555555]">JPEG, PNG, or WebP</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <div className="text-sm"><span className="text-[#555555]">Original: </span><span className="font-mono text-[#888888]">{formatBytes(originalSize)}</span></div>
            <div className="text-sm"><span className="text-[#555555]">Compressed: </span><span className="font-mono text-[#22c55e]">{busy ? "…" : formatBytes(compressedSize)}</span></div>
            {reduction > 0 && !busy && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] rounded-full">
                <TrendingDown size={12} /> {reduction}% smaller
              </span>
            )}
            <button onClick={reset} className="ml-auto text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
              Use a different image
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">Format</label>
              <div className="flex">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateFormat(f.id)}
                    className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                      format === f.id ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {format !== "image/png" && (
              <div className="flex-1 min-w-[160px] max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#888888] font-medium">Quality</label>
                  <span className="text-xs font-mono text-[#a855f7]">{quality}%</span>
                </div>
                <input type="range" min={10} max={100} value={quality} onChange={(e) => updateQuality(Number(e.target.value))} className="w-full accent-[#a855f7]" />
              </div>
            )}
            {image && (
              <div className="flex-1 min-w-[160px] max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#888888] font-medium">Max width</label>
                  <span className="text-xs font-mono text-[#a855f7]">{maxWidth}px</span>
                </div>
                <input type="range" min={50} max={image.naturalWidth} value={maxWidth} onChange={(e) => updateMaxWidth(Number(e.target.value))} className="w-full accent-[#a855f7]" />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col items-center gap-2 p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <span className="text-[10px] text-[#555555] uppercase tracking-wide">
                Original — {image?.naturalWidth}×{image?.naturalHeight}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image?.src} alt="Original" className="max-w-full max-h-64 object-contain" />
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <span className="text-[10px] text-[#555555] uppercase tracking-wide">
                Compressed — {resultDims.width}×{resultDims.height}
              </span>
              {resultUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resultUrl} alt="Compressed" className="max-w-full max-h-64 object-contain" />
              )}
            </div>
          </div>

          <button
            onClick={download}
            disabled={!resultBlob || busy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
          >
            <Download size={14} /> Download Compressed Image
          </button>
        </>
      )}
    </ToolLayout>
  );
}
