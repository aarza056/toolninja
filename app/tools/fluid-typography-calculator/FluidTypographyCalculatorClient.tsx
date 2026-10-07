"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertTriangle } from "lucide-react";
import { buildClamp, buildScale } from "@/lib/fluid-typography";

const SCALE_STEPS = [
  { label: "xs", power: -2 },
  { label: "sm", power: -1 },
  { label: "base", power: 0 },
  { label: "lg", power: 1 },
  { label: "xl", power: 2 },
  { label: "2xl", power: 3 },
  { label: "3xl", power: 4 },
];

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <div>
      <label className="text-xs text-[#888888] font-medium block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 pr-10 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555555]">{suffix}</span>
      </div>
    </div>
  );
}

export default function FluidTypographyCalculatorClient() {
  const [minSize, setMinSize] = useState(16);
  const [maxSize, setMaxSize] = useState(24);
  const [minViewport, setMinViewport] = useState(400);
  const [maxViewport, setMaxViewport] = useState(1280);
  const [ratio, setRatio] = useState(1.25);

  const { result, error } = useMemo(() => {
    try {
      return { result: buildClamp({ minSizePx: minSize, maxSizePx: maxSize, minViewportPx: minViewport, maxViewportPx: maxViewport }), error: "" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [minSize, maxSize, minViewport, maxViewport]);

  const scale = useMemo(() => buildScale(minSize, maxSize, ratio, SCALE_STEPS), [minSize, maxSize, ratio]);

  return (
    <ToolLayout title="CSS clamp() / Fluid Typography Calculator" description="Build a fluid font-size that scales smoothly between a min and max viewport — no media queries">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min font size" value={minSize} onChange={setMinSize} suffix="px" />
            <Field label="Max font size" value={maxSize} onChange={setMaxSize} suffix="px" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min viewport" value={minViewport} onChange={setMinViewport} suffix="px" />
            <Field label="Max viewport" value={maxViewport} onChange={setMaxViewport} suffix="px" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-sm text-[#ef4444]">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">font-size</label>
                <CopyButton text={`font-size: ${result.clamp};`} size="sm" />
              </div>
              <pre className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] font-mono text-sm text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
                {`font-size: ${result.clamp};`}
              </pre>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">Scale ratio (for the preview scale)</label>
              <span className="text-xs font-mono text-[#a855f7]">{ratio.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={1.1}
              max={1.5}
              step={0.005}
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              className="w-full accent-[#a855f7]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-[#888888] font-medium block">
            Preview — resize your browser window to see each step scale fluidly
          </label>
          {scale.map((step) => {
            let clampStr = "";
            try {
              clampStr = buildClamp({ minSizePx: step.minSizePx, maxSizePx: step.maxSizePx, minViewportPx: minViewport, maxViewportPx: maxViewport }).clamp;
            } catch {
              clampStr = "";
            }
            return (
              <div key={step.label} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#555555] uppercase tracking-wide">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#555555]">{step.minSizePx.toFixed(1)}px → {step.maxSizePx.toFixed(1)}px</span>
                    {clampStr && <CopyButton text={`font-size: ${clampStr};`} size="sm" />}
                  </div>
                </div>
                <p style={{ fontSize: clampStr || `${step.minSizePx}px` }} className="text-[#f5f5f5] font-semibold truncate">
                  The quick brown fox
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        <code className="text-[#e879f9]">clamp(min, preferred, max)</code> grows linearly between your
        min and max font sizes as the viewport goes from min to max width, then holds steady outside
        that range — no media query breakpoints needed. The <code className="text-[#e879f9]">preferred</code>{" "}
        value mixes a fixed <code className="text-[#e879f9]">rem</code> offset with a{" "}
        <code className="text-[#e879f9]">vw</code> unit, derived from the slope between your two size/viewport
        pairs — the same math underlying most fluid-type generators.
      </div>
    </ToolLayout>
  );
}
