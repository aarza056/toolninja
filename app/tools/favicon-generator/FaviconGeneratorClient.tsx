"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Upload, Download, ImagePlus, X } from "lucide-react";
import { FAVICON_SIZES, renderFaviconSize, buildFaviconHtmlSnippet, buildWebManifest, type WebManifestOptions } from "@/lib/favicon";

const DISPLAY_MODES: WebManifestOptions["display"][] = ["standalone", "fullscreen", "minimal-ui", "browser"];

export default function FaviconGeneratorClient() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [useBg, setUseBg] = useState(false);
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [dragOver, setDragOver] = useState(false);
  const [renders, setRenders] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState("My App");
  const [shortName, setShortName] = useState("My App");
  const [themeColor, setThemeColor] = useState("#a855f7");
  const [manifestBg, setManifestBg] = useState("#0a0a0a");
  const [display, setDisplay] = useState<WebManifestOptions["display"]>("standalone");

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

  const manifestJson = buildWebManifest({ name: appName, shortName, themeColor, backgroundColor: manifestBg, display });

  const downloadManifest = () => {
    const blob = new Blob([manifestJson], { type: "application/manifest+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site.webmanifest";
    a.click();
    URL.revokeObjectURL(a.href);
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

          {/* Web app manifest */}
          <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
            <label className="text-xs text-[#888888] font-medium block mb-3">Web App Manifest (PWA)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-[#666666] block mb-1">App name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
              <div>
                <label className="text-xs text-[#666666] block mb-1">Short name</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
              <div>
                <label className="text-xs text-[#666666] block mb-1">Theme color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5" />
                  <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="flex-1 px-2 py-1.5 text-xs font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] block mb-1">Background color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={manifestBg} onChange={(e) => setManifestBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5" />
                  <input type="text" value={manifestBg} onChange={(e) => setManifestBg(e.target.value)} className="flex-1 px-2 py-1.5 text-xs font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-[#666666]">Display mode</label>
              <div className="flex">
                {DISPLAY_MODES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisplay(d)}
                    className={`px-2.5 py-1 text-xs border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                      display === d ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">site.webmanifest</label>
              <div className="flex items-center gap-2">
                <button onClick={downloadManifest} className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors">
                  <Download size={11} /> Download
                </button>
                <CopyButton text={manifestJson} size="sm" />
              </div>
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">{manifestJson}</pre>
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
