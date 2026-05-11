"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import ToolLayout from "@/components/ToolLayout";
import { Download, Copy, Check, QrCode } from "lucide-react";

const STORAGE_KEY = "toolninja:qr-code-generator";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type SizeOption = "Small" | "Medium" | "Large";

const SIZE_MAP: Record<SizeOption, number> = {
  Small: 200,
  Medium: 300,
  Large: 400,
};

const ERROR_LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const SIZE_OPTIONS: SizeOption[] = ["Small", "Medium", "Large"];

export default function QrCodeGeneratorClient() {
  const [text, setText] = useState("");
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("M");
  const [sizeOption, setSizeOption] = useState<SizeOption>("Medium");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  const renderQr = useCallback(async (
    value: string,
    ec: ErrorCorrectionLevel,
    size: number,
    fg: string,
    bg: string
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!value.trim()) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);
      }
      setQrError("");
      return;
    }

    try {
      await QRCode.toCanvas(canvas, value, {
        errorCorrectionLevel: ec,
        width: size,
        margin: 2,
        color: {
          dark: fg,
          light: bg,
        },
      });
      setQrError("");
    } catch (e: unknown) {
      setQrError(e instanceof Error ? e.message : "Failed to generate QR code");
    }
  }, []);

  // Debounced re-render on text change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      renderQr(text, ecLevel, SIZE_MAP[sizeOption], fgColor, bgColor);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, ecLevel, sizeOption, fgColor, bgColor, renderQr]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    try {
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { reject(new Error("Failed to create blob")); return; }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, "image/png");
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy data URL as text
      const url = canvas.toDataURL("image/png");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasContent = text.trim().length > 0;
  const size = SIZE_MAP[sizeOption];

  const SegButton = <T extends string>({
    value,
    current,
    onClick,
    children,
  }: {
    value: T;
    current: T;
    onClick: (v: T) => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 text-sm border transition-colors first:rounded-l-[6px] last:rounded-r-[6px] ${
        value === current
          ? "bg-[#a855f7] border-[#a855f7] text-white"
          : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
      }`}
    >
      {children}
    </button>
  );

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate QR codes from any URL or text — download as PNG"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: controls */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Text input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">URL or text</label>
              <span className="text-xs text-[#555555]">{text.length} chars</span>
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          {/* Error correction */}
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">
              Error correction
            </label>
            <div className="flex">
              {ERROR_LEVELS.map((l) => (
                <SegButton key={l} value={l} current={ecLevel} onClick={setEcLevel}>
                  {l}
                </SegButton>
              ))}
            </div>
            <p className="text-xs text-[#555555] mt-1">
              {ecLevel === "L" && "~7% data restore capacity"}
              {ecLevel === "M" && "~15% data restore capacity"}
              {ecLevel === "Q" && "~25% data restore capacity"}
              {ecLevel === "H" && "~30% data restore capacity"}
            </p>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Size</label>
            <div className="flex">
              {SIZE_OPTIONS.map((s) => (
                <SegButton key={s} value={s} current={sizeOption} onClick={setSizeOption}>
                  {s}
                </SegButton>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">
                Foreground (dark modules)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">
                Background (light modules)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {hasContent && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadPng}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
              >
                <Download size={14} />
                Download PNG
              </button>
              <button
                onClick={copyImage}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-[6px] border transition-colors ${
                  copied
                    ? "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10"
                    : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border-[#222222]"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Image"}
              </button>
            </div>
          )}

          {qrError && (
            <p className="text-xs text-[#ef4444]">{qrError}</p>
          )}
        </div>

        {/* Right: QR preview */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative flex items-center justify-center bg-[#111111] border border-[#222222] rounded-[8px] overflow-hidden"
            style={{ width: size + 24, height: size + 24 }}
          >
            {/* Canvas is always mounted so ref is always attached */}
            <canvas ref={canvasRef} style={{ display: hasContent ? "block" : "none" }} />
            {!hasContent && (
              <div
                className="flex flex-col items-center gap-3 text-[#444444]"
                style={{ width: size, height: size, justifyContent: "center", display: "flex", flexDirection: "column" }}
              >
                <QrCode size={48} strokeWidth={1} />
                <p className="text-sm text-center px-4">Enter a URL or text to generate a QR code</p>
              </div>
            )}
          </div>
          {hasContent && (
            <p className="text-xs text-[#555555]">
              {size}×{size}px · Error correction {ecLevel}
            </p>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
