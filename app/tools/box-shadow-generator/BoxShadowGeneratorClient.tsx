"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, X } from "lucide-react";

interface ShadowLayer {
  id: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
  inset: boolean;
}

let nextId = 2;

const INITIAL_LAYERS: ShadowLayer[] = [
  { id: 1, x: 0, y: 4, blur: 12, spread: 0, color: "#000000", alpha: 25, inset: false },
];

function hexToRgba(hex: string, alphaPercent: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${(alphaPercent / 100).toFixed(2)})`;
}

function buildShadowValue(layer: ShadowLayer): string {
  const color = hexToRgba(layer.color, layer.alpha);
  return `${layer.inset ? "inset " : ""}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`;
}

export default function BoxShadowGeneratorClient() {
  const [layers, setLayers] = useState<ShadowLayer[]>(INITIAL_LAYERS);
  const [boxColor, setBoxColor] = useState("#1a1a1a");

  const shadowValue = layers.map(buildShadowValue).join(",\n    ");
  const cssOutput = `box-shadow: ${shadowValue};`;

  const addLayer = () => {
    if (layers.length >= 6) return;
    setLayers((prev) => [
      ...prev,
      { id: nextId++, x: 0, y: 8, blur: 16, spread: 0, color: "#a855f7", alpha: 30, inset: false },
    ]);
  };

  const removeLayer = (id: number) => setLayers((prev) => prev.filter((l) => l.id !== id));

  const updateLayer = (id: number, field: keyof ShadowLayer, value: string | number | boolean) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  return (
    <ToolLayout
      title="CSS Box Shadow Generator"
      description="Build single or multi-layer CSS box shadows visually, with live preview"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: layer controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">
              Shadow Layers ({layers.length}/6)
            </label>
            <button
              onClick={addLayer}
              disabled={layers.length >= 6}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-[6px] bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={11} /> Add Layer
            </button>
          </div>

          <div className="space-y-3">
            {layers.map((layer, idx) => (
              <div key={layer.id} className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#555555]">Layer {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[#888888]">
                      <input
                        type="checkbox"
                        checked={layer.inset}
                        onChange={(e) => updateLayer(layer.id, "inset", e.target.checked)}
                        className="accent-[#a855f7]"
                      />
                      Inset
                    </label>
                    {layers.length > 1 && (
                      <button
                        onClick={() => removeLayer(layer.id)}
                        className="text-[#555555] hover:text-[#ef4444] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["x", "y", "blur", "spread"] as const).map((field) => (
                    <div key={field}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-[#666666] uppercase tracking-wide">{field}</label>
                        <span className="text-[10px] font-mono text-[#a855f7]">{layer[field]}px</span>
                      </div>
                      <input
                        type="range"
                        min={field === "blur" || field === "spread" ? 0 : -50}
                        max={50}
                        value={layer[field]}
                        onChange={(e) => updateLayer(layer.id, field, Number(e.target.value))}
                        className="w-full accent-[#a855f7]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => updateLayer(layer.id, "color", e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-[#333333] bg-transparent p-0.5"
                    />
                    <code className="text-xs font-mono text-[#888888]">{layer.color}</code>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-[10px] text-[#666666] uppercase tracking-wide shrink-0">Opacity</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.alpha}
                      onChange={(e) => updateLayer(layer.id, "alpha", Number(e.target.value))}
                      className="flex-1 accent-[#a855f7]"
                    />
                    <span className="text-[10px] font-mono text-[#a855f7] w-8 text-right">{layer.alpha}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">CSS Output</label>
              <CopyButton text={cssOutput} size="sm" />
            </div>
            <pre className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] font-mono text-sm text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
              {cssOutput}
            </pre>
          </div>
        </div>

        {/* Right: preview */}
        <div className="lg:sticky lg:top-6 h-fit space-y-3">
          <label className="text-xs text-[#888888] font-medium block">Preview</label>
          <div
            className="rounded-[8px] p-12 flex items-center justify-center"
            style={{ background: "repeating-conic-gradient(#151515 0% 25%, #0a0a0a 0% 50%) 50% / 20px 20px" }}
          >
            <div
              className="w-32 h-32 rounded-[12px]"
              style={{ background: boxColor, boxShadow: shadowValue }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#888888]">Box color</label>
            <input
              type="color"
              value={boxColor}
              onChange={(e) => setBoxColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-[#333333] bg-transparent p-0.5"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
