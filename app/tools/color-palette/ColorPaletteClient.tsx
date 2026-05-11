"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";

// ─── HSL / HEX / RGB math ────────────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

// ─── Harmony generators ───────────────────────────────────────────────────────

interface SwatchColor {
  hex: string;
  hsl: [number, number, number];
  rgb: [number, number, number];
  label: string;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "monochromatic";

function generatePalette(baseHex: string, harmony: HarmonyType): SwatchColor[] {
  const [h, s, l] = hexToHsl(baseHex);

  const make = (hue: number, sat: number, lig: number, label: string): SwatchColor => {
    const nh = normalizeHue(hue);
    return {
      hex: hslToHex(nh, sat, lig),
      hsl: [nh, sat, lig],
      rgb: hslToRgb(nh, sat, lig),
      label,
    };
  };

  switch (harmony) {
    case "complementary":
      return [
        make(h, s, l, "Base"),
        make(h + 180, s, l, "Complement"),
      ];
    case "analogous":
      return [
        make(h - 60, s, l, "-60°"),
        make(h - 30, s, l, "-30°"),
        make(h, s, l, "Base"),
        make(h + 30, s, l, "+30°"),
        make(h + 60, s, l, "+60°"),
      ];
    case "triadic":
      return [
        make(h, s, l, "Base"),
        make(h + 120, s, l, "+120°"),
        make(h + 240, s, l, "+240°"),
      ];
    case "split-complementary":
      return [
        make(h, s, l, "Base"),
        make(h + 150, s, l, "+150°"),
        make(h + 210, s, l, "+210°"),
      ];
    case "tetradic":
      return [
        make(h, s, l, "Base"),
        make(h + 90, s, l, "+90°"),
        make(h + 180, s, l, "+180°"),
        make(h + 270, s, l, "+270°"),
      ];
    case "monochromatic":
      return [
        make(h, s, 20, "20% L"),
        make(h, s, 35, "35% L"),
        make(h, s, 50, "50% L"),
        make(h, s, 65, "65% L"),
        make(h, s, 80, "80% L"),
      ];
  }
}

// ─── Swatch card ─────────────────────────────────────────────────────────────

function SwatchCard({ color }: { color: SwatchColor }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(color.hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [color.hex]);

  const [r, g, b] = color.rgb;
  const [ch, cs, cl] = color.hsl;

  return (
    <div className="flex-1 min-w-[110px] max-w-[160px] rounded-[8px] border border-[#222222] overflow-hidden bg-[#111111]">
      {/* Color square */}
      <button
        onClick={copy}
        className="relative w-full h-24 group focus:outline-none"
        style={{ backgroundColor: color.hex }}
        title="Click to copy hex"
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          {copied ? (
            <Check size={18} className="text-white drop-shadow" />
          ) : (
            <Copy size={16} className="text-white drop-shadow" />
          )}
        </span>
      </button>

      {/* Values */}
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-sm text-[#f5f5f5] truncate">{color.hex.toUpperCase()}</span>
          {copied && (
            <span className="text-[10px] text-[#22c55e] shrink-0">Copied!</span>
          )}
        </div>
        <p className="text-xs text-[#555555] font-mono truncate">
          hsl({ch},{cs}%,{cl}%)
        </p>
        <p className="text-xs text-[#555555] font-mono truncate">
          rgb({r},{g},{b})
        </p>
        <p className="text-[10px] text-[#444444]">{color.label}</p>
      </div>
    </div>
  );
}

// ─── Harmony button list ──────────────────────────────────────────────────────

const HARMONY_OPTIONS: { value: HarmonyType; label: string }[] = [
  { value: "complementary", label: "Complementary" },
  { value: "analogous", label: "Analogous" },
  { value: "triadic", label: "Triadic" },
  { value: "split-complementary", label: "Split-Comp" },
  { value: "tetradic", label: "Tetradic" },
  { value: "monochromatic", label: "Monochromatic" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ColorPaletteClient() {
  const [baseColor, setBaseColor] = useState("#a855f7");
  const [harmony, setHarmony] = useState<HarmonyType>("complementary");
  const [copiedBase, setCopiedBase] = useState(false);

  const palette = generatePalette(baseColor, harmony);
  const [bh, bs, bl] = hexToHsl(baseColor);
  const [br, bg2, bb] = hslToRgb(bh, bs, bl);

  const copyBase = () => {
    navigator.clipboard.writeText(baseColor.toUpperCase()).then(() => {
      setCopiedBase(true);
      setTimeout(() => setCopiedBase(false), 1500);
    });
  };

  return (
    <ToolLayout
      title="Color Palette Generator"
      description="Generate harmonious color palettes using HSL color theory. Pick a base color and a harmony type."
    >
      <div className="space-y-6">
        {/* Base color picker row */}
        <div className="flex flex-wrap items-start gap-5">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Base Color</label>
            <div className="flex items-center gap-3">
              {/* Color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-14 h-14 rounded-[8px] border-2 border-[#333333] cursor-pointer bg-transparent p-0.5"
                  style={{ WebkitAppearance: "none" } as React.CSSProperties}
                />
              </div>
              {/* Hex text input */}
              <div>
                <input
                  type="text"
                  value={baseColor.toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBaseColor(v.toLowerCase());
                  }}
                  maxLength={7}
                  spellCheck={false}
                  className="w-28 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>
          </div>

          {/* Base color summary card */}
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-[#888888] font-medium block mb-2">Base Color Values</label>
            <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div
                className="w-10 h-10 rounded-[6px] shrink-0 border border-[#333333]"
                style={{ backgroundColor: baseColor }}
              />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#f5f5f5]">{baseColor.toUpperCase()}</span>
                  <button onClick={copyBase} className="text-[#555555] hover:text-[#a855f7] transition-colors">
                    {copiedBase ? <Check size={13} className="text-[#22c55e]" /> : <Copy size={13} />}
                  </button>
                  {copiedBase && <span className="text-[10px] text-[#22c55e]">Copied!</span>}
                </div>
                <p className="text-xs text-[#555555] font-mono">hsl({bh}, {bs}%, {bl}%)</p>
                <p className="text-xs text-[#555555] font-mono">rgb({br}, {bg2}, {bb})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Harmony type selector */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Harmony Type</label>
          <div className="flex flex-wrap gap-2">
            {HARMONY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setHarmony(value)}
                className={`px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
                  harmony === value
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5] hover:border-[#333333]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Palette swatches */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-3">
            Palette — {palette.length} colors · Click any swatch to copy hex
          </label>
          <div className="flex flex-wrap gap-3">
            {palette.map((color, i) => (
              <SwatchCard key={i} color={color} />
            ))}
          </div>
        </div>

        {/* All values table */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">All Values</label>
          <div className="overflow-x-auto rounded-[8px] border border-[#222222]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left px-3 py-2 text-xs text-[#555555] font-medium w-10">Swatch</th>
                  <th className="text-left px-3 py-2 text-xs text-[#555555] font-medium">HEX</th>
                  <th className="text-left px-3 py-2 text-xs text-[#555555] font-medium">HSL</th>
                  <th className="text-left px-3 py-2 text-xs text-[#555555] font-medium">RGB</th>
                </tr>
              </thead>
              <tbody>
                {palette.map((color, i) => {
                  const [ch, cs, cl] = color.hsl;
                  const [cr, cg, cb] = color.rgb;
                  return (
                    <tr key={i} className="border-b border-[#1a1a1a] last:border-0">
                      <td className="px-3 py-2">
                        <div
                          className="w-6 h-6 rounded-[4px] border border-[#333333]"
                          style={{ backgroundColor: color.hex }}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-[#f5f5f5]">{color.hex.toUpperCase()}</td>
                      <td className="px-3 py-2 font-mono text-[#888888]">hsl({ch}, {cs}%, {cl}%)</td>
                      <td className="px-3 py-2 font-mono text-[#888888]">rgb({cr}, {cg}, {cb})</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
