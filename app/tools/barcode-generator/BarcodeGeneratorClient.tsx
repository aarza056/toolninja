"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Download, Barcode as BarcodeIcon } from "lucide-react";
import { generateBarcode, type BarcodeFormat } from "@/lib/barcode";

const STORAGE_KEY = "toolninja:barcode-generator";

const FORMATS: { id: BarcodeFormat; label: string; placeholder: string; hint: string }[] = [
  { id: "code128", label: "Code 128", placeholder: "TOOLNINJA-2026", hint: "Any printable ASCII text — letters, numbers, punctuation" },
  { id: "ean13", label: "EAN-13", placeholder: "400638133393", hint: "12 digits (check digit auto-added) or 13 digits" },
  { id: "upca", label: "UPC-A", placeholder: "036000291452", hint: "11 digits (check digit auto-added) or 12 digits" },
  { id: "ean8", label: "EAN-8", placeholder: "9638507", hint: "7 digits (check digit auto-added) or 8 digits" },
  { id: "code39", label: "Code 39", placeholder: "TOOLNINJA-39", hint: "A–Z, 0–9 and - . space $ / + % (lowercase is uppercased)" },
  { id: "itf14", label: "ITF-14", placeholder: "1540014128876", hint: "13 digits (check digit auto-added) or 14 digits — the GTIN-14 for cartons" },
];

interface Props {
  /** The format of a /tools/barcode-generator/<type> page */
  initialFormat?: BarcodeFormat;
  heading?: string;
  intro?: string;
}

export default function BarcodeGeneratorClient({ initialFormat, heading, intro }: Props = {}) {
  const [format, setFormat] = useState<BarcodeFormat>(initialFormat ?? "code128");
  const [value, setValue] = useState(FORMATS.find((f) => f.id === (initialFormat ?? "code128"))!.placeholder);
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // A format page starts on its own format and example
    if (initialFormat) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.format) setFormat(parsed.format);
        if (parsed.value) setValue(parsed.value);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ format, value }));
    } catch {}
  }, [format, value]);

  const { result, error } = useMemo(() => {
    if (!value.trim()) return { result: null, error: "" };
    try {
      return { result: generateBarcode(format, value.trim()), error: "" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Could not generate barcode" };
    }
  }, [format, value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const quietZone = barWidth * 10;
    const textHeight = 20;

    if (!result) {
      canvas.width = 300;
      canvas.height = height + textHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const barsWidth = result.modules.length * barWidth;
    canvas.width = barsWidth + quietZone * 2;
    canvas.height = height + textHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    for (let i = 0; i < result.modules.length; i++) {
      if (result.modules[i] === "1") {
        ctx.fillRect(quietZone + i * barWidth, 0, barWidth, height);
      }
    }

    ctx.fillStyle = "#000000";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(result.displayText, canvas.width / 2, height + 16);
  }, [result, barWidth, height]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `barcode-${format}.png`;
    a.click();
  };

  const downloadSvg = () => {
    if (!result) return;
    const quietZone = barWidth * 10;
    const textHeight = 20;
    const barsWidth = result.modules.length * barWidth;
    const width = barsWidth + quietZone * 2;
    const totalHeight = height + textHeight;

    let rects = "";
    for (let i = 0; i < result.modules.length; i++) {
      if (result.modules[i] === "1") {
        rects += `<rect x="${quietZone + i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">` +
      `<rect width="${width}" height="${totalHeight}" fill="#fff"/>` +
      rects +
      `<text x="${width / 2}" y="${height + 16}" font-family="monospace" font-size="14" text-anchor="middle" fill="#000">${result.displayText}</text>` +
      `</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `barcode-${format}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeFormat = FORMATS.find((f) => f.id === format)!;

  return (
    <ToolLayout
      title={heading ?? "Barcode Generator"}
      description={intro ?? "Generate Code 128, EAN-13, UPC-A, EAN-8, Code 39 and ITF-14 barcodes — download as PNG or SVG, entirely in your browser"}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap gap-1">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFormat(f.id);
                  // Keep the value if it fits the new format, otherwise show that format's example
                  try {
                    generateBarcode(f.id, value.trim());
                  } catch {
                    setValue(f.placeholder);
                  }
                }}
                className={`px-3 py-1.5 text-sm border rounded-[6px] transition-colors ${
                  format === f.id ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={activeFormat.placeholder}
              className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            <p className="text-xs text-[#555555] mt-1">{activeFormat.hint}</p>
            {error && <p className="text-xs text-[#ef4444] mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">Bar width</label>
                <span className="text-xs font-mono text-[#a855f7]">{barWidth}px</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={barWidth}
                onChange={(e) => setBarWidth(Number(e.target.value))}
                className="w-full accent-[#a855f7]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">Height</label>
                <span className="text-xs font-mono text-[#a855f7]">{height}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={160}
                step={10}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-[#a855f7]"
              />
            </div>
          </div>

          {result && (
            <div className="flex gap-2">
              <button
                onClick={downloadPng}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
              >
                <Download size={14} />
                PNG
              </button>
              <button
                onClick={downloadSvg}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
              >
                <Download size={14} />
                SVG
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-[#111111] border border-[#222222] rounded-[8px] min-w-0 lg:min-w-[340px]">
          {result ? (
            <div className="overflow-x-auto max-w-full">
              <canvas ref={canvasRef} className="bg-white rounded" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#444444] py-8">
              <BarcodeIcon size={40} strokeWidth={1} />
              <p className="text-sm text-center px-4">Enter a value to generate a barcode</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
