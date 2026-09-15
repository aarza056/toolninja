"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download } from "lucide-react";

const STORAGE_KEY = "toolninja:placeholder-image-generator";

const PRESETS = [
  { label: "16:9 (1280×720)", width: 1280, height: 720 },
  { label: "Square (600×600)", width: 600, height: 600 },
  { label: "Card (400×300)", width: 400, height: 300 },
  { label: "Avatar (128×128)", width: 128, height: 128 },
  { label: "Banner (1200×300)", width: 1200, height: 300 },
];

interface Settings {
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
  text: string;
  fontSize: number;
}

const DEFAULT_SETTINGS: Settings = {
  width: 600,
  height: 400,
  bgColor: "#1a1a1a",
  textColor: "#a855f7",
  text: "",
  fontSize: 0, // 0 = auto
};

function draw(canvas: HTMLCanvasElement, s: Settings) {
  canvas.width = s.width;
  canvas.height = s.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = s.bgColor;
  ctx.fillRect(0, 0, s.width, s.height);

  const label = s.text.trim() || `${s.width} × ${s.height}`;
  const fontSize = s.fontSize > 0 ? s.fontSize : Math.max(12, Math.round(Math.min(s.width, s.height) / 8));

  ctx.fillStyle = s.textColor;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, s.width / 2, s.height / 2, s.width * 0.9);
}

export default function PlaceholderImageGeneratorClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
    if (canvasRef.current) {
      draw(canvasRef.current, settings);
      setDataUrl(canvasRef.current.toDataURL("image/png"));
    }
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `placeholder-${settings.width}x${settings.height}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [settings.width, settings.height]);

  const inputClass =
    "w-full px-2.5 py-1.5 text-sm bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="Placeholder Image Generator"
      description="Generate placeholder images with custom size, color, and text — entirely in your browser"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Preset</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setSettings((s) => ({ ...s, width: p.width, height: p.height }))}
                  className="px-2.5 py-1 text-[11px] bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Width (px)</label>
              <input
                type="number"
                min={1}
                max={4000}
                value={settings.width}
                onChange={(e) => update("width", Math.max(1, Math.min(4000, Number(e.target.value) || 1)))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Height (px)</label>
              <input
                type="number"
                min={1}
                max={4000}
                value={settings.height}
                onChange={(e) => update("height", Math.max(1, Math.min(4000, Number(e.target.value) || 1)))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.bgColor}
                  onChange={(e) => update("bgColor", e.target.value)}
                  className="w-9 h-9 rounded-[6px] border border-[#222222] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.bgColor}
                  onChange={(e) => update("bgColor", e.target.value)}
                  spellCheck={false}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Text color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => update("textColor", e.target.value)}
                  className="w-9 h-9 rounded-[6px] border border-[#222222] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => update("textColor", e.target.value)}
                  spellCheck={false}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Custom text (optional)</label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) => update("text", e.target.value)}
              placeholder={`Defaults to "${settings.width} × ${settings.height}"`}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">
              Font size (0 = auto: {settings.fontSize === 0 ? Math.max(12, Math.round(Math.min(settings.width, settings.height) / 8)) : settings.fontSize}px)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={settings.fontSize}
              onChange={(e) => update("fontSize", Math.max(0, Number(e.target.value) || 0))}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
            >
              <Download size={14} /> Download PNG
            </button>
            <CopyButton text={dataUrl} label="Copy data URI" size="sm" />
          </div>
        </div>

        <div className="flex items-center justify-center p-6 bg-[#0d0d0d] border border-[#222222] rounded-[8px] min-h-[300px] overflow-auto">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[500px] rounded-[4px]"
            style={{ imageRendering: "auto" }}
          />
        </div>
      </div>
    </ToolLayout>
  );
}
