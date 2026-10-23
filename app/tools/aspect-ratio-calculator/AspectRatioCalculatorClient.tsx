"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { computeRatio, solveDimension, ASPECT_RATIO_PRESETS } from "@/lib/aspect-ratio";

export default function AspectRatioCalculatorClient() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [knownDim, setKnownDim] = useState(800);
  const [solveFor, setSolveFor] = useState<"width" | "height">("height");

  const { result: ratioResult, error: ratioError } = useMemo(() => {
    try {
      return { result: computeRatio(width, height), error: "" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [width, height]);

  const { result: solved, error: solveError } = useMemo(() => {
    try {
      return { result: solveDimension(knownDim, ratioW, ratioH, solveFor), error: "" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [knownDim, ratioW, ratioH, solveFor]);

  const previewRatio = ratioResult ? ratioResult.decimal : 1;

  return (
    <ToolLayout title="Aspect Ratio Calculator" description="Simplify a width/height into a ratio, or solve for a missing dimension given a ratio">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-8">
          {/* Simplify */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Simplify a ratio</h3>
            <div className="flex items-end gap-3 mb-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-28 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
              <span className="text-[#555555] pb-2.5">×</span>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-28 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>
            {ratioError ? (
              <p className="text-xs text-[#ef4444]">{ratioError}</p>
            ) : ratioResult && (
              <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <span className="font-mono text-2xl text-[#a855f7] font-bold">{ratioResult.ratioW}:{ratioResult.ratioH}</span>
                <span className="text-xs text-[#555555]">({ratioResult.decimal.toFixed(4)})</span>
                <CopyButton text={`${ratioResult.ratioW}:${ratioResult.ratioH}`} size="sm" className="ml-auto" />
              </div>
            )}
          </div>

          {/* Solve */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Solve a missing dimension</h3>
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Ratio</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={ratioW}
                    onChange={(e) => setRatioW(Number(e.target.value))}
                    className="w-16 px-2 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                  />
                  <span className="text-[#555555]">:</span>
                  <input
                    type="number"
                    value={ratioH}
                    onChange={(e) => setRatioH(Number(e.target.value))}
                    className="w-16 px-2 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">I know the</label>
                <div className="flex">
                  {(["width", "height"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSolveFor(d === "width" ? "height" : "width")}
                      className={`px-3 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                        solveFor !== d ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">{solveFor === "height" ? "Width" : "Height"} value</label>
                <input
                  type="number"
                  value={knownDim}
                  onChange={(e) => setKnownDim(Number(e.target.value))}
                  className="w-28 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>
            {solveError ? (
              <p className="text-xs text-[#ef4444]">{solveError}</p>
            ) : solved !== null && (
              <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <span className="text-xs text-[#888888]">{solveFor} =</span>
                <span className="font-mono text-2xl text-[#a855f7] font-bold">{Math.round(solved * 100) / 100}</span>
                <CopyButton text={String(Math.round(solved * 100) / 100)} size="sm" className="ml-auto" />
              </div>
            )}
          </div>

          {/* Presets */}
          <div>
            <p className="text-[10px] text-[#555555] mb-2">Common ratios:</p>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIO_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setRatioW(p.w); setRatioH(p.h); setWidth(p.w * 100); setHeight(p.h * 100); }}
                  className="text-[11px] px-2 py-1 bg-[#111111] border border-[#222222] rounded-[4px] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <label className="text-xs text-[#888888] font-medium block mb-2">Preview</label>
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] flex items-center justify-center min-h-[200px]">
            <div
              className="bg-[#a855f7]/20 border-2 border-[#a855f7] rounded-[4px] flex items-center justify-center max-w-full max-h-[240px]"
              style={{
                aspectRatio: previewRatio,
                width: previewRatio >= 1 ? "100%" : "auto",
                height: previewRatio >= 1 ? "auto" : "240px",
              }}
            >
              <span className="text-xs text-[#a855f7] font-mono">{ratioResult ? `${ratioResult.ratioW}:${ratioResult.ratioH}` : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
