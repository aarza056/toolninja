"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type TrackMode = "equal" | "responsive";
type JustifyItems = "stretch" | "start" | "end" | "center";
type AlignItems = "stretch" | "start" | "end" | "center";

const SELECT_CLASS =
  "w-full px-2.5 py-1.5 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
const LABEL_CLASS = "text-[10px] text-[#666666] uppercase tracking-wide block mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

export default function CssGridGeneratorClient() {
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(2);
  const [trackMode, setTrackMode] = useState<TrackMode>("equal");
  const [minTrackWidth, setMinTrackWidth] = useState(160);
  const [gap, setGap] = useState(12);
  const [justifyItems, setJustifyItems] = useState<JustifyItems>("stretch");
  const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
  const [selected, setSelected] = useState(0);
  const [colSpan, setColSpan] = useState(1);
  const [rowSpan, setRowSpan] = useState(1);

  const totalCells = columns * rows;

  const gridTemplateColumns =
    trackMode === "equal" ? `repeat(${columns}, 1fr)` : `repeat(auto-fit, minmax(${minTrackWidth}px, 1fr))`;
  const gridTemplateRows = `repeat(${rows}, minmax(60px, auto))`;

  const containerCss = [
    `display: grid;`,
    `grid-template-columns: ${gridTemplateColumns};`,
    `grid-template-rows: ${gridTemplateRows};`,
    `gap: ${gap}px;`,
    `justify-items: ${justifyItems};`,
    `align-items: ${alignItems};`,
  ].join("\n");

  const itemOverrides = colSpan > 1 || rowSpan > 1;
  const itemCss = itemOverrides
    ? `\n\n.item-${selected + 1} {\n${colSpan > 1 ? `  grid-column: span ${colSpan};\n` : ""}${rowSpan > 1 ? `  grid-row: span ${rowSpan};\n` : ""}}`
    : "";

  const fullCss = `.container {\n${containerCss.split("\n").map((l) => "  " + l).join("\n")}\n}${itemCss}`;

  const cells = useMemo(() => Array.from({ length: totalCells }, (_, i) => i), [totalCells]);

  return (
    <ToolLayout
      title="CSS Grid Generator"
      description="Build a CSS grid layout visually — columns, rows, gaps, and per-cell spans — with copy-ready CSS"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Field label="Track sizing">
            <select value={trackMode} onChange={(e) => setTrackMode(e.target.value as TrackMode)} className={SELECT_CLASS}>
              <option value="equal">Equal columns (1fr each)</option>
              <option value="responsive">Responsive (auto-fit, minmax)</option>
            </select>
          </Field>

          {trackMode === "equal" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLASS}>Columns</label>
                <span className="text-[10px] font-mono text-[#a855f7]">{columns}</span>
              </div>
              <input type="range" min={1} max={6} value={columns} onChange={(e) => setColumns(Number(e.target.value))} className="w-full accent-[#a855f7]" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLASS}>Min track width</label>
                <span className="text-[10px] font-mono text-[#a855f7]">{minTrackWidth}px</span>
              </div>
              <input
                type="range"
                min={80}
                max={320}
                step={10}
                value={minTrackWidth}
                onChange={(e) => setMinTrackWidth(Number(e.target.value))}
                className="w-full accent-[#a855f7]"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLASS}>Rows</label>
              <span className="text-[10px] font-mono text-[#a855f7]">{rows}</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={rows}
              onChange={(e) => {
                const n = Number(e.target.value);
                setRows(n);
                if (selected >= columns * n) setSelected(0);
              }}
              className="w-full accent-[#a855f7]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLASS}>Gap</label>
              <span className="text-[10px] font-mono text-[#a855f7]">{gap}px</span>
            </div>
            <input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-[#a855f7]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="justify-items">
              <select value={justifyItems} onChange={(e) => setJustifyItems(e.target.value as JustifyItems)} className={SELECT_CLASS}>
                {(["stretch", "start", "end", "center"] as JustifyItems[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="align-items">
              <select value={alignItems} onChange={(e) => setAlignItems(e.target.value as AlignItems)} className={SELECT_CLASS}>
                {(["stretch", "start", "end", "center"] as AlignItems[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
            <Field label={`Selected cell: #${selected + 1}`}>
              <div className="flex flex-wrap gap-1">
                {cells.map((i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`w-7 h-7 text-xs rounded-[4px] border transition-colors ${
                      selected === i ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#1a1a1a] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL_CLASS}>Col span</label>
                  <span className="text-[10px] font-mono text-[#a855f7]">{colSpan}</span>
                </div>
                <input type="range" min={1} max={Math.max(1, columns)} value={colSpan} onChange={(e) => setColSpan(Number(e.target.value))} className="w-full accent-[#a855f7]" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL_CLASS}>Row span</label>
                  <span className="text-[10px] font-mono text-[#a855f7]">{rowSpan}</span>
                </div>
                <input type="range" min={1} max={Math.max(1, rows)} value={rowSpan} onChange={(e) => setRowSpan(Number(e.target.value))} className="w-full accent-[#a855f7]" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">CSS Output</label>
              <CopyButton text={fullCss} size="sm" />
            </div>
            <pre className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] font-mono text-xs text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
              {fullCss}
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <label className="text-xs text-[#888888] font-medium block mb-2">Preview</label>
          <div
            className="min-h-[420px] p-4 rounded-[8px] border border-[#222222]"
            style={{
              display: "grid",
              gridTemplateColumns,
              gridTemplateRows,
              gap: `${gap}px`,
              justifyItems,
              alignItems,
              background: "repeating-conic-gradient(#151515 0% 25%, #0a0a0a 0% 50%) 50% / 20px 20px",
            }}
          >
            {cells.map((i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-[6px] text-sm font-mono font-semibold w-full h-full min-h-[50px]"
                style={{
                  background: i === selected ? "#a855f7" : "#2a2a35",
                  color: i === selected ? "#fff" : "#a1a1aa",
                  gridColumn: i === selected && colSpan > 1 ? `span ${colSpan}` : undefined,
                  gridRow: i === selected && rowSpan > 1 ? `span ${rowSpan}` : undefined,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
