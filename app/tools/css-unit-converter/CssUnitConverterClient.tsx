"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { CSS_UNITS, convert, type CssUnit } from "@/lib/css-units";

function formatNum(n: number): string {
  return Number(n.toFixed(4)).toString();
}

export default function CssUnitConverterClient() {
  const [value, setValue] = useState(16);
  const [fromUnit, setFromUnit] = useState<CssUnit>("px");
  const [basePx, setBasePx] = useState(16);

  const results = useMemo(() => {
    return CSS_UNITS.map((unit) => ({
      unit,
      value: convert(value, fromUnit, unit, basePx),
    }));
  }, [value, fromUnit, basePx]);

  return (
    <ToolLayout title="CSS Unit Converter" description="Convert between px, rem, em, pt, and % — with a configurable base font size">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-32 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">From unit</label>
            <div className="flex">
              {CSS_UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setFromUnit(u)}
                  className={`px-3 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    fromUnit === u ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Base font size</label>
            <div className="relative">
              <input
                type="number"
                value={basePx}
                onChange={(e) => setBasePx(Number(e.target.value) || 16)}
                className="w-28 px-3 py-2 pr-9 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555555]">px</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map((r) => (
            <div key={r.unit} className={`flex items-center justify-between p-3 rounded-[8px] border ${r.unit === fromUnit ? "border-[#a855f7]/40 bg-[#a855f7]/5" : "border-[#222222] bg-[#111111]"}`}>
              <div>
                <span className="text-[10px] text-[#555555] uppercase tracking-wide block mb-0.5">{r.unit}</span>
                <span className="font-mono text-lg text-[#f5f5f5]">{formatNum(r.value)}{r.unit}</span>
              </div>
              <CopyButton text={`${formatNum(r.value)}${r.unit}`} size="sm" />
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
          This converter treats <code className="text-[#e879f9]">em</code> the same as{" "}
          <code className="text-[#e879f9]">rem</code> — relative to the base font size above — for
          simplicity. In real CSS, <code className="text-[#e879f9]">em</code> is actually relative to
          the <em>parent</em> element&apos;s computed font size, which can compound across nested
          elements; <code className="text-[#e879f9]">rem</code> always refers to the root{" "}
          (<code className="text-[#e879f9]">&lt;html&gt;</code>) element&apos;s font size regardless of
          nesting, which is exactly why it&apos;s usually the safer default for sizing.
        </div>
      </div>
    </ToolLayout>
  );
}
