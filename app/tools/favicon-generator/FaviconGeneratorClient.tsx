"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Upload, Download, ImagePlus, X } from "lucide-react";
import { FAVICON_SIZES, renderFaviconSize, buildFaviconHtmlSnippet } from "@/lib/favicon";

export default function FaviconGeneratorClient() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [useBg, setUseBg] = useState(false);
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [dragOver, setDragOver] = useState(false);
  const [renders, setRenders] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderAll = useCallback((img: HTMLImageElement, bg: string | null) => {
    const out: Record<number, string> = {};
    FAVICON_SIZES.forEach((fs) => {
      out[fs.size] = renderFaviconSize(img, fs.size, bg);
    });
    setRenders(out);
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setFileName(file.name);
        renderAll(img, useBg ? bgColor : null);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }, [renderAll, useBg, bgColor]);

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

  const toggleBg = (on: boolean) => {
    setUseBg(on);
    if (image) renderAll(image, on ? bgColor : null);
  };

  const changeBgColor = (color: string) => {
    setBgColor(color);
    if (image && useBg) renderAll(image, color);
  };

  const clear = () => {
    setImage(null);
    setFileName("");
    setRenders({});
  };

  const downloadOne = (size: number, filename: string) => {
    const dataUrl = renders[size];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const downloadAll = () => {
    FAVICON_SIZES.forEach((fs, i) => {
      setTimeout(() => downloadOne(fs.size, fs.filename), i * 150);
    });
  };

  return (
    <ToolLayout
      title="Favicon Generator"
      description="Upload one image, get every favicon size your site needs"
    >
      {!image ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors ${
            dragOver ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#222222] hover:border-[#333333]"
          }`}
        >
          <ImagePlus size={40} strokeWidth={1} className="text-[#444444]" />
          <p className="text-sm text-[#888888]">Drag & drop an image, or click to upload</p>
          <p className="text-xs text-[#555555]">PNG, JPG, or SVG — ideally square, 512×512 or larger</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={renders[192] ?? renders[48] ?? renders[32]} alt="preview" className="w-10 h-10 rounded shrink-0" />
              <span className="text-sm text-[#f5f5f5] truncate">{fileName}</span>
            </div>
            <button onClick={clear} className="p-1.5 text-[#555555] hover:text-[#ef4444] transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Background option */}
          <div className="flex items-center gap-4 mb-5">
            <label className="flex items-center gap-2 text-sm text-[#888888]">
              <input type="checkbox" checked={useBg} onChange={(e) => toggleBg(e.target.checked)} className="accent-[#a855f7]" />
              Add solid background
            </label>
            {useBg && (
              <input
                type="color"
                value={bgColor}
                onChange={(e) => changeBgColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5"
              />
            )}
            <button
              onClick={downloadAll}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
            >
              <Download size={14} /> Download all sizes
            </button>
          </div>

          {/* Size grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {FAVICON_SIZES.map((fs) => (
              <div key={fs.size} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center w-16 h-16 rounded overflow-hidden"
                  style={{ background: "repeating-conic-gradient(#1a1a1a 0% 25%, #0d0d0d 0% 50%) 50% / 10px 10px" }}
                >
                  {renders[fs.size] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={renders[fs.size]}
                      alt={fs.label}
                      width={fs.size >= 64 ? 56 : fs.size}
                      height={fs.size >= 64 ? 56 : fs.size}
                      style={{ imageRendering: fs.size <= 32 ? "pixelated" : "auto" }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-[#888888] text-center leading-snug">{fs.label}</p>
                <button
                  onClick={() => downloadOne(fs.size, fs.filename)}
                  className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors"
                >
                  <Download size={11} /> {fs.filename}
                </button>
              </div>
            ))}
          </div>

          {/* HTML snippet */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">HTML to add to your &lt;head&gt;</label>
              <CopyButton text={buildFaviconHtmlSnippet()} size="sm" />
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">
              {buildFaviconHtmlSnippet()}
            </pre>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Upload size={12} /> Use a different image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </>
      )}
    </ToolLayout>
  );
}
