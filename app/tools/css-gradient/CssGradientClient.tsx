"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, X } from "lucide-react";

type GradientType = "linear" | "radial" | "conic" | "mesh";
type RadialShape = "circle" | "ellipse";
type RadialPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

interface ColorStop {
  id: number;
  color: string;
  position: number;
}

interface MeshBlob {
  id: number;
  color: string;
  x: number;
  y: number;
}

const RADIAL_POSITIONS: RadialPosition[] = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top left",
  "top right",
  "bottom left",
  "bottom right",
];

let nextId = 3;

function buildGradientCss(
  type: GradientType,
  linearAngle: number,
  radialShape: RadialShape,
  radialPosition: RadialPosition,
  conicAngle: number,
  stops: ColorStop[]
): string {
  const stopStr = stops.map((s) => `${s.color} ${s.position}%`).join(", ");
  if (type === "linear") return `linear-gradient(${linearAngle}deg, ${stopStr})`;
  if (type === "radial") return `radial-gradient(${radialShape} at ${radialPosition}, ${stopStr})`;
  return `conic-gradient(from ${conicAngle}deg, ${stopStr})`;
}

function buildMeshCss(blobs: MeshBlob[]): string {
  return blobs
    .map((b) => `radial-gradient(at ${b.x}% ${b.y}%, ${b.color} 0%, transparent 50%)`)
    .join(",\n    ");
}

export default function CssGradientClient() {
  const [type, setType] = useState<GradientType>("linear");
  const [linearAngle, setLinearAngle] = useState(90);
  const [radialShape, setRadialShape] = useState<RadialShape>("circle");
  const [radialPosition, setRadialPosition] = useState<RadialPosition>("center");
  const [conicAngle, setConicAngle] = useState(0);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: "#a855f7", position: 0 },
    { id: 2, color: "#3b82f6", position: 100 },
  ]);
  const [blobs, setBlobs] = useState<MeshBlob[]>([
    { id: 1, color: "#a855f7", x: 20, y: 25 },
    { id: 2, color: "#3b82f6", x: 75, y: 20 },
    { id: 3, color: "#ec4899", x: 25, y: 75 },
    { id: 4, color: "#22c55e", x: 80, y: 80 },
  ]);

  const isMesh = type === "mesh";
  const gradientValue = isMesh
    ? buildMeshCss(blobs)
    : buildGradientCss(type, linearAngle, radialShape, radialPosition, conicAngle, stops);

  const cssOutput = isMesh
    ? `background:\n    ${gradientValue};`
    : `background: ${gradientValue};`;

  const addStop = () => {
    if (stops.length >= 6) return;
    const newPos = Math.round(
      (stops[stops.length - 2].position + stops[stops.length - 1].position) / 2
    );
    setStops((prev) => [...prev, { id: nextId++, color: "#ec4899", position: newPos }]);
  };

  const removeStop = (id: number) => setStops((prev) => prev.filter((s) => s.id !== id));
  const updateStop = (id: number, field: "color" | "position", value: string | number) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const updateBlob = (id: number, field: keyof MeshBlob, value: string | number) =>
    setBlobs((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  const types: GradientType[] = ["linear", "radial", "conic", "mesh"];

  return (
    <ToolLayout
      title="CSS Gradient Generator"
      description="Generate CSS gradients visually. Linear, radial, conic, and mesh supported."
    >
      <div className="max-w-2xl space-y-6">
        {/* Type selector */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Gradient Type</label>
          <div className="flex">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] capitalize transition-colors ${
                  type === t
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Linear controls */}
        {type === "linear" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">Angle</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={linearAngle}
                  onChange={(e) => setLinearAngle(Math.min(360, Math.max(0, +e.target.value)))}
                  className="w-16 px-2 py-1 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] text-right"
                />
                <span className="text-sm text-[#888888]">deg</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={linearAngle}
              onChange={(e) => setLinearAngle(+e.target.value)}
              className="w-full accent-[#a855f7]"
            />
            <div className="flex justify-between text-xs text-[#555555] mt-1">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>
        )}

        {/* Radial controls */}
        {type === "radial" && (
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">Shape</label>
              <div className="flex">
                {(["circle", "ellipse"] as RadialShape[]).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setRadialShape(shape)}
                    className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] capitalize transition-colors ${
                      radialShape === shape
                        ? "bg-[#a855f7] border-[#a855f7] text-white"
                        : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">Position</label>
              <div className="flex flex-wrap gap-1.5">
                {RADIAL_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setRadialPosition(pos)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors ${
                      radialPosition === pos
                        ? "bg-[#a855f7] border-[#a855f7] text-white"
                        : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conic controls */}
        {type === "conic" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">Starting Angle</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={conicAngle}
                  onChange={(e) => setConicAngle(Math.min(360, Math.max(0, +e.target.value)))}
                  className="w-16 px-2 py-1 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] text-right"
                />
                <span className="text-sm text-[#888888]">deg</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={conicAngle}
              onChange={(e) => setConicAngle(+e.target.value)}
              className="w-full accent-[#a855f7]"
            />
            <div className="flex justify-between text-xs text-[#555555] mt-1">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>
        )}

        {/* Mesh blob controls */}
        {type === "mesh" && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">
              Mesh Blobs — each blob is a radial gradient anchored at X/Y
            </label>
            <div className="space-y-2">
              {blobs.map((blob, idx) => (
                <div
                  key={blob.id}
                  className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]"
                >
                  <input
                    type="color"
                    value={blob.color}
                    onChange={(e) => updateBlob(blob.id, "color", e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-[4px] border border-[#333333] bg-transparent p-0.5 flex-shrink-0"
                  />
                  <span className="text-xs text-[#555555] w-14 font-mono flex-shrink-0">
                    Blob {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-[#555555] flex-shrink-0">X</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={blob.x}
                      onChange={(e) => updateBlob(blob.id, "x", +e.target.value)}
                      className="flex-1 accent-[#a855f7]"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={blob.x}
                      onChange={(e) =>
                        updateBlob(blob.id, "x", Math.min(100, Math.max(0, +e.target.value)))
                      }
                      className="w-12 px-1.5 py-0.5 text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded-[4px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] text-right"
                    />
                    <span className="text-xs text-[#555555]">%</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-[#555555] flex-shrink-0">Y</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={blob.y}
                      onChange={(e) => updateBlob(blob.id, "y", +e.target.value)}
                      className="flex-1 accent-[#a855f7]"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={blob.y}
                      onChange={(e) =>
                        updateBlob(blob.id, "y", Math.min(100, Math.max(0, +e.target.value)))
                      }
                      className="w-12 px-1.5 py-0.5 text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded-[4px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] text-right"
                    />
                    <span className="text-xs text-[#555555]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color stops (non-mesh only) */}
        {!isMesh && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">
                Color Stops ({stops.length}/6)
              </label>
              <button
                onClick={addStop}
                disabled={stops.length >= 6}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-[6px] bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={11} /> Add Stop
              </button>
            </div>
            <div className="space-y-2">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]"
                >
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-[4px] border border-[#333333] bg-transparent p-0.5 flex-shrink-0"
                  />
                  <code className="text-xs font-mono text-[#888888] w-16">{stop.color}</code>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(e) => updateStop(stop.id, "position", +e.target.value)}
                      className="flex-1 accent-[#a855f7]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) =>
                          updateStop(stop.id, "position", Math.min(100, Math.max(0, +e.target.value)))
                        }
                        className="w-12 px-1.5 py-0.5 text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded-[4px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] text-right"
                      />
                      <span className="text-xs text-[#555555]">%</span>
                    </div>
                  </div>
                  {stops.length > 2 && (
                    <button
                      onClick={() => removeStop(stop.id)}
                      className="p-1 text-[#555555] hover:text-[#ef4444] transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live preview */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Preview</label>
          <div
            className="w-full rounded-[8px] border border-[#222222]"
            style={{ height: "240px", background: gradientValue }}
          />
        </div>

        {/* CSS output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#888888] font-medium">CSS Output</label>
            <CopyButton text={cssOutput} size="sm" />
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <code className="text-sm font-mono text-[#f5f5f5] break-all whitespace-pre-wrap">
              {cssOutput}
            </code>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
