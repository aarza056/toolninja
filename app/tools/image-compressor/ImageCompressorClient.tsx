"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Upload, Download, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { loadImage, compressImage, formatBytes, type OutputFormat } from "@/lib/image-compressor";

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "image/jpeg", label: "JPEG" },
  { id: "image/webp", label: "WebP" },
  { id: "image/png", label: "PNG" },
];

interface BatchItem {
  file: File;
  status: "pending" | "done" | "error";
  blob?: Blob;
  url?: string;
  width?: number;
  height?: number;
}

function outputName(file: File, format: OutputFormat): string {
  return file.name.replace(/\.[^.]+$/, "") + `-compressed.${format.split("/")[1]}`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function BatchCompressor({ files, onReset }: { files: File[]; onReset: () => void }) {
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(0);
  const [items, setItems] = useState<BatchItem[]>(() => files.map((file) => ({ file, status: "pending" })));
  const [settings, setSettings] = useState({ format, quality, maxWidth });

  useEffect(() => {
    const t = setTimeout(() => setSettings({ format, quality, maxWidth }), 300);
    return () => clearTimeout(t);
  }, [format, quality, maxWidth]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const { format, quality, maxWidth } = settings;
    setItems(files.map((file) => ({ file, status: "pending" })));

    (async () => {
      // Sequential on purpose: decoding many large images at once can exhaust memory on mobile
      for (let i = 0; i < files.length; i++) {
        if (cancelled) return;
        let next: BatchItem;
        try {
          const img = await loadImage(files[i]);
          const result = await compressImage(img, { format, quality: quality / 100, maxWidth: maxWidth > 0 ? maxWidth : undefined });
          const url = URL.createObjectURL(result.blob);
          urls.push(url);
          next = { file: files[i], status: "done", blob: result.blob, url, width: result.width, height: result.height };
        } catch {
          next = { file: files[i], status: "error" };
        }
        if (cancelled) return;
        setItems((prev) => prev.map((it, idx) => (idx === i ? next : it)));
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files, settings]);

  const done = items.filter((i) => i.status === "done");
  const totalBefore = done.reduce((s, i) => s + i.file.size, 0);
  const totalAfter = done.reduce((s, i) => s + (i.blob?.size ?? 0), 0);
  const totalReduction = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
  const allDone = done.length + items.filter((i) => i.status === "error").length === items.length;

  const downloadAll = async () => {
    for (const item of done) {
      triggerDownload(item.url!, outputName(item.file, settings.format));
      // Small gap so browsers don't drop rapid-fire downloads
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
        <div className="text-sm text-[#888888]">
          {done.length}/{items.length} images
        </div>
        <div className="text-sm">
          <span className="text-[#555555]">Total: </span>
          <span className="font-mono text-[#888888]">{formatBytes(totalBefore)}</span>
          <span className="text-[#555555]"> → </span>
          <span className="font-mono text-[#22c55e]">{formatBytes(totalAfter)}</span>
        </div>
        {totalReduction > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] rounded-full">
            <TrendingDown size={12} /> {totalReduction}% smaller
          </span>
        )}
        <button onClick={onReset} className="ml-auto text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
          Start over
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Format</label>
          <div className="flex">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
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
            <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-[#a855f7]" />
          </div>
        )}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Max width (px, 0 = keep)</label>
          <input
            type="number"
            min={0}
            step={100}
            value={maxWidth}
            onChange={(e) => setMaxWidth(Math.max(0, Number(e.target.value)))}
            className="w-28 px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {items.map((item, i) => {
          const saved = item.blob ? Math.round((1 - item.blob.size / item.file.size) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-sm">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="w-10 h-10 object-cover rounded border border-[#222222]" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded border border-[#222222]">
                  {item.status === "error" ? <AlertCircle size={14} className="text-[#ef4444]" /> : <Loader2 size={14} className="animate-spin text-[#555555]" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[#f5f5f5] truncate">{item.file.name}</p>
                <p className="text-xs text-[#555555] font-mono">
                  {formatBytes(item.file.size)}
                  {item.blob && (
                    <>
                      {" → "}
                      <span className={saved > 0 ? "text-[#22c55e]" : "text-[#f97316]"}>{formatBytes(item.blob.size)}</span>
                      {` · ${item.width}×${item.height}`}
                    </>
                  )}
                  {item.status === "error" && <span className="text-[#ef4444]"> · couldn&apos;t read this image</span>}
                </p>
              </div>
              {item.blob && (
                <span className={`text-xs font-semibold ${saved > 0 ? "text-[#22c55e]" : "text-[#f97316]"}`}>
                  {saved > 0 ? `-${saved}%` : `+${Math.abs(saved)}%`}
                </span>
              )}
              {item.url && (
                <button
                  onClick={() => triggerDownload(item.url!, outputName(item.file, settings.format))}
                  className="p-1.5 text-[#888888] hover:text-[#f5f5f5] transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={downloadAll}
        disabled={!allDone || done.length === 0}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
      >
        <Download size={14} /> Download all ({done.length})
      </button>
      <p className="text-xs text-[#555555] mt-2">
        Your browser may ask once for permission to download multiple files. A file that comes out larger (shown in orange) was
        already well compressed — keep the original for that one.
      </p>
    </>
  );
}

export default function ImageCompressorClient() {
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
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

  const acceptFiles = (list: FileList | null | undefined) => {
    const images = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (images.length > 1) setBatchFiles(images);
    else if (images.length === 1) loadFile(images[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFiles(e.dataTransfer.files);
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
    <ToolLayout title="Image Compressor" description="Compress and resize JPEG, PNG, and WebP images — one at a time or in a batch, entirely in your browser">
      {batchFiles.length > 0 ? (
        <BatchCompressor files={batchFiles} onReset={() => setBatchFiles([])} />
      ) : !file ? (
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
          <p className="text-sm text-[#888888]">Drag & drop images, or click to upload</p>
          <p className="text-xs text-[#555555]">JPEG, PNG, or WebP — select several at once for batch mode</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
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
