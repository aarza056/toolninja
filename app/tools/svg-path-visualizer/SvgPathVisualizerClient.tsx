"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle } from "lucide-react";
import { summarizePath, commandLabel } from "@/lib/svg-path";

const STORAGE_KEY = "toolninja:svg-path-visualizer";
const SAMPLE = "M12 2 L15 8.5 L22 9.3 L17 14.1 L18.2 21 L12 17.8 L5.8 21 L7 14.1 L2 9.3 L9 8.5 Z";

export default function SvgPathVisualizerClient() {
  const [pathD, setPathD] = useState("");
  const [strokeColor, setStrokeColor] = useState("#a855f7");
  const [fillColor, setFillColor] = useState("#a855f7");
  const [showFill, setShowFill] = useState(true);
  const pathRef = useRef<SVGPathElement>(null);
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  const [pathError, setPathError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setPathD(saved ?? SAMPLE);
    } catch {
      setPathD(SAMPLE);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, pathD); } catch {}
  }, [pathD]);

  useEffect(() => {
    if (!pathRef.current || !pathD.trim()) {
      setBbox(null);
      setPathError("");
      return;
    }
    try {
      const box = pathRef.current.getBBox();
      if (box.width === 0 && box.height === 0 && pathD.trim()) {
        setPathError("Couldn't render this as a valid path — check the d attribute syntax.");
        setBbox(null);
      } else {
        setBbox(box);
        setPathError("");
      }
    } catch {
      setPathError("Couldn't render this as a valid path.");
      setBbox(null);
    }
  }, [pathD]);

  const summary = useMemo(() => (pathD.trim() ? summarizePath(pathD) : null), [pathD]);

  const viewBox = bbox
    ? `${(bbox.x - bbox.width * 0.1).toFixed(2)} ${(bbox.y - bbox.height * 0.1).toFixed(2)} ${(bbox.width * 1.2).toFixed(2)} ${(bbox.height * 1.2).toFixed(2)}`
    : "0 0 24 24";

  return (
    <ToolLayout title="SVG Path Visualizer" description="Paste a path d attribute and see it rendered live, with its bounding box and command breakdown">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">Path d attribute</label>
              <button onClick={() => setPathD(SAMPLE)} className="text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
                Load example (star)
              </button>
            </div>
            <textarea
              value={pathD}
              onChange={(e) => setPathD(e.target.value)}
              placeholder="M10 10 L90 10 L50 90 Z"
              spellCheck={false}
              className="w-full h-28 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            {pathError && (
              <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1.5">
                <AlertCircle size={12} /> {pathError}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#888888]">Stroke</label>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#333333] bg-transparent p-0.5" />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#888888] cursor-pointer">
              <input type="checkbox" checked={showFill} onChange={(e) => setShowFill(e.target.checked)} className="accent-[#a855f7]" />
              Fill
            </label>
            {showFill && (
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#333333] bg-transparent p-0.5" />
            )}
          </div>

          {summary && summary.segments.length > 0 && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">
                Commands ({summary.segments.length})
              </label>
              <div className="max-h-[220px] overflow-auto space-y-1 pr-1">
                {summary.segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-xs">
                    <code className="text-[#a855f7] font-mono font-bold w-5 shrink-0">{seg.command}</code>
                    <span className="text-[#555555] shrink-0">{commandLabel(seg.command)}</span>
                    {seg.args.length > 0 && <code className="text-[#888888] font-mono truncate">{seg.args.join(", ")}</code>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 h-fit space-y-3">
          <label className="text-xs text-[#888888] font-medium block">Preview</label>
          <div
            className="aspect-square rounded-[8px] border border-[#222222] p-4"
            style={{ background: "repeating-conic-gradient(#151515 0% 25%, #0a0a0a 0% 50%) 50% / 20px 20px" }}
          >
            <svg viewBox={viewBox} className="w-full h-full overflow-visible">
              <path
                ref={pathRef}
                d={pathD || "M0 0"}
                stroke={strokeColor}
                strokeWidth={Math.max((bbox?.width ?? 24) / 120, 0.3)}
                fill={showFill ? fillColor : "none"}
                fillOpacity={showFill ? 0.35 : 0}
              />
            </svg>
          </div>

          {bbox && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs space-y-1">
              <div className="flex justify-between"><span className="text-[#555555]">Bounding box</span><CopyButton text={`${bbox.width.toFixed(2)} × ${bbox.height.toFixed(2)}`} size="sm" /></div>
              <p className="font-mono text-[#f5f5f5]">x: {bbox.x.toFixed(2)}, y: {bbox.y.toFixed(2)}</p>
              <p className="font-mono text-[#f5f5f5]">w: {bbox.width.toFixed(2)}, h: {bbox.height.toFixed(2)}</p>
            </div>
          )}

          {summary && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#888888] space-y-1">
              <p>{summary.hasCurves ? "Contains curves" : "Straight lines only"}</p>
              <p>{summary.hasRelative && summary.hasAbsolute ? "Mixed relative/absolute" : summary.hasRelative ? "Relative coordinates" : "Absolute coordinates"}</p>
              <p>{summary.isClosed ? "Closed path" : "Open path"}</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
