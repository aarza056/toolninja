"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

function hexToRgb(hex: string): [number, number, number] | null {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!r) return null;
  return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - rf - k) / (1 - k);
  const m = (1 - gf - k) / (1 - k);
  const y = (1 - bf - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

// sRGB -> OKLCH, following Björn Ottosson's OKLab formulas (https://bottosson.github.io/posts/oklab/)
function srgbToLinear(c: number): number {
  const cn = c / 255;
  return cn <= 0.04045 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [Math.round(L * 1000) / 10, Math.round(C * 1000) / 1000, Math.round(H * 10) / 10];
}

function parseInput(raw: string): [number, number, number] | null {
  raw = raw.trim();
  if (raw.startsWith("#") || /^[a-f0-9]{3,6}$/i.test(raw)) {
    const hex = raw.startsWith("#") ? raw : "#" + raw;
    return hexToRgb(hex);
  }
  let m = raw.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return [+m[1], +m[2], +m[3]];
  m = raw.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  if (m) return hslToRgb(+m[1], +m[2], +m[3]);
  return null;
}

export default function ColorConverterClient() {
  const [input, setInput] = useState("#a855f7");
  const [pickerColor, setPickerColor] = useState("#a855f7");
  const [error, setError] = useState("");

  const rgb = useCallback(() => {
    const r = parseInput(input);
    if (!r) return null;
    return r;
  }, [input]);

  const colors = useCallback(() => {
    const r = rgb();
    if (!r) return null;
    const [red, green, blue] = r;
    const [h, s, l] = rgbToHsl(red, green, blue);
    const hex = rgbToHex(red, green, blue);
    const [c, m, y, k] = rgbToCmyk(red, green, blue);
    const [ol, oc, oh] = rgbToOklch(red, green, blue);
    return {
      hex,
      rgb: `rgb(${red}, ${green}, ${blue})`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
      cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`,
      oklch: `oklch(${ol}% ${oc} ${oh})`,
    };
  }, [rgb]);

  const result = colors();

  const handleInput = (val: string) => {
    setInput(val);
    const r = parseInput(val);
    if (r) {
      setPickerColor(rgbToHex(...r));
      setError("");
    } else {
      setError("Unrecognized color format");
    }
  };

  const handlePicker = (val: string) => {
    setPickerColor(val);
    setInput(val);
    setError("");
  };

  return (
    <ToolLayout title="Color Converter" description="Convert between HEX, RGB, HSL, CMYK, and OKLCH color formats">
      <div className="max-w-lg">
        {/* Color preview + picker row */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-[8px] border border-[#222222] flex-shrink-0"
            style={{ background: result?.hex || "#222222" }}
          />
          <div className="flex flex-col gap-2">
            <input
              type="color"
              value={pickerColor}
              onChange={(e) => handlePicker(e.target.value)}
              className="h-8 w-24 cursor-pointer rounded-[6px] border border-[#222222] bg-[#111111] p-0.5"
              title="Pick a color"
            />
            <p className="text-xs text-[#888888]">Click to pick any color</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="text-xs text-[#888888] font-medium block mb-1">Color Input (HEX, RGB, or HSL)</label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="#a855f7 or rgb(168,85,247) or hsl(271,91%,65%)"
            className={`w-full px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
            spellCheck={false}
          />
          {error && <p className="text-xs text-[#ef4444] mt-1">{error}</p>}
        </div>

        {/* Conversions */}
        {result && (
          <div className="space-y-3">
            {(["hex", "rgb", "hsl", "cmyk", "oklch"] as const).map((fmt) => (
              <div key={fmt} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <span className="w-12 text-xs font-semibold text-[#888888] uppercase shrink-0">{fmt}</span>
                <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{result[fmt]}</code>
                <CopyButton text={result[fmt]} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
