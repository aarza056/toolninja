"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import { ArrowLeftRight, CheckCircle2, XCircle } from "lucide-react";
import { parseColor, toHex, contrastRatio, checkWcag, adjustLightness } from "@/lib/contrast";

const STORAGE_KEY = "toolninja:contrast-checker";

function CheckRow({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-[6px] border ${
        pass ? "border-[#22c55e]/30 bg-[#22c55e]/10" : "border-[#ef4444]/30 bg-[#ef4444]/10"
      }`}
    >
      <div className="flex items-center gap-2">
        {pass ? (
          <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
        ) : (
          <XCircle size={15} className="text-[#ef4444] shrink-0" />
        )}
        <span className={`text-sm font-medium ${pass ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{label}</span>
      </div>
      <span className="text-xs text-[#888888]">{detail}</span>
    </div>
  );
}

export default function ContrastCheckerClient() {
  const [fg, setFg] = useState("#f5f5f5");
  const [bg, setBg] = useState("#0a0a0a");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fg) setFg(parsed.fg);
        if (parsed.bg) setBg(parsed.bg);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ fg, bg })); } catch {}
  }, [fg, bg]);

  const fgRgb = useMemo(() => parseColor(fg), [fg]);
  const bgRgb = useMemo(() => parseColor(bg), [bg]);

  const ratio = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;
  const results = ratio !== null ? checkWcag(ratio) : null;

  const suggestion = useMemo(() => {
    if (!fgRgb || !bgRgb || !results || results.aaNormal) return null;
    const bgLum = bgRgb.r * 0.2126 + bgRgb.g * 0.7152 + bgRgb.b * 0.0722;
    const goDarker = bgLum > 128; // light background → darken foreground, and vice versa
    for (let step = 1; step <= 20; step++) {
      const candidate = adjustLightness(fgRgb, goDarker ? -step / 20 : step / 20);
      if (contrastRatio(candidate, bgRgb) >= 4.5) return toHex(candidate);
    }
    return null;
  }, [fgRgb, bgRgb, results]);

  const swapColors = () => {
    setFg(bg);
    setBg(fg);
  };

  const colorInput = (value: string, onChange: (v: string) => void, label: string) => (
    <div className="flex-1 min-w-0">
      <label className="text-xs text-[#888888] font-medium block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={parseColor(value) ? toHex(parseColor(value)!) : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border border-[#222222] bg-transparent p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          spellCheck={false}
          className="flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Color Contrast Checker"
      description="Check WCAG AA/AAA contrast compliance between two colors"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: controls */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-end gap-3">
            {colorInput(fg, setFg, "Foreground (text)")}
            <button
              onClick={swapColors}
              title="Swap colors"
              className="p-2 mb-0.5 text-[#888888] hover:text-[#a855f7] bg-[#1a1a1a] hover:bg-[#222222] border border-[#222222] rounded-[6px] transition-colors shrink-0"
            >
              <ArrowLeftRight size={16} />
            </button>
            {colorInput(bg, setBg, "Background")}
          </div>

          {!fgRgb || !bgRgb ? (
            <p className="text-xs text-[#ef4444]">
              Enter valid colors as hex (#rrggbb) or rgb(r, g, b).
            </p>
          ) : (
            <>
              <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] text-center">
                <div className="text-4xl font-bold text-[#f5f5f5]">{ratio!.toFixed(2)}</div>
                <div className="text-xs text-[#888888] mt-1">Contrast ratio (1 – 21)</div>
              </div>

              <div className="space-y-2">
                <CheckRow label="AA — Normal text" pass={results!.aaNormal} detail="min 4.5:1" />
                <CheckRow label="AA — Large text (18pt+/14pt bold)" pass={results!.aaLarge} detail="min 3:1" />
                <CheckRow label="AA — UI components / graphics" pass={results!.aaUiComponents} detail="min 3:1" />
                <CheckRow label="AAA — Normal text" pass={results!.aaaNormal} detail="min 7:1" />
                <CheckRow label="AAA — Large text" pass={results!.aaaLarge} detail="min 4.5:1" />
              </div>

              {suggestion && (
                <div className="p-3 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-[8px] text-sm">
                  <span className="text-[#888888]">Suggested foreground to pass AA normal text: </span>
                  <button
                    onClick={() => setFg(suggestion)}
                    className="font-mono text-[#a855f7] hover:underline"
                  >
                    {suggestion}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: live preview */}
        {fgRgb && bgRgb && (
          <div className="flex-1 min-w-0">
            <label className="text-xs text-[#888888] font-medium block mb-2">Live preview</label>
            <div
              className="rounded-[8px] border border-[#222222] p-6 space-y-4"
              style={{ background: toHex(bgRgb) }}
            >
              <p style={{ color: toHex(fgRgb), fontSize: "14px" }}>
                Normal text (14px) — The quick brown fox jumps over the lazy dog.
              </p>
              <p style={{ color: toHex(fgRgb), fontSize: "24px", fontWeight: 700 }}>
                Large text (24px bold)
              </p>
              <button
                style={{ color: toHex(fgRgb), border: `2px solid ${toHex(fgRgb)}` }}
                className="px-4 py-2 rounded-[6px] text-sm font-medium bg-transparent"
              >
                Sample button
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
