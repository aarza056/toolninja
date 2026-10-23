"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Direction = "row" | "row-reverse" | "column" | "column-reverse";
type Wrap = "nowrap" | "wrap" | "wrap-reverse";
type Justify = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
type AlignItems = "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
type AlignContent = "stretch" | "flex-start" | "flex-end" | "center" | "space-between" | "space-around";
type AlignSelf = "auto" | "flex-start" | "flex-end" | "center" | "stretch" | "baseline";

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

export default function CssFlexboxGeneratorClient() {
  const [direction, setDirection] = useState<Direction>("row");
  const [wrap, setWrap] = useState<Wrap>("nowrap");
  const [justify, setJustify] = useState<Justify>("flex-start");
  const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
  const [alignContent, setAlignContent] = useState<AlignContent>("stretch");
  const [gap, setGap] = useState(12);
  const [itemCount, setItemCount] = useState(5);
  const [selected, setSelected] = useState(0);
  const [selfAlign, setSelfAlign] = useState<AlignSelf>("auto");
  const [selfGrow, setSelfGrow] = useState(0);

  const containerCss = [
    `display: flex;`,
    `flex-direction: ${direction};`,
    `flex-wrap: ${wrap};`,
    `justify-content: ${justify};`,
    `align-items: ${alignItems};`,
    ...(wrap !== "nowrap" ? [`align-content: ${alignContent};`] : []),
    `gap: ${gap}px;`,
  ].join("\n");

  const itemOverrides = selfAlign !== "auto" || selfGrow > 0;
  const itemCss = itemOverrides
    ? `\n\n.item-${selected + 1} {\n${selfAlign !== "auto" ? `  align-self: ${selfAlign};\n` : ""}${selfGrow > 0 ? `  flex-grow: ${selfGrow};\n` : ""}}`
    : "";

  const fullCss = `.container {\n${containerCss.split("\n").map((l) => "  " + l).join("\n")}\n}${itemCss}`;

  return (
    <ToolLayout
      title="CSS Flexbox Generator"
      description="Build flex container and item properties visually, with a live preview and copy-ready CSS"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Direction">
              <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className={SELECT_CLASS}>
                {(["row", "row-reverse", "column", "column-reverse"] as Direction[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Wrap">
              <select value={wrap} onChange={(e) => setWrap(e.target.value as Wrap)} className={SELECT_CLASS}>
                {(["nowrap", "wrap", "wrap-reverse"] as Wrap[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Justify content">
              <select value={justify} onChange={(e) => setJustify(e.target.value as Justify)} className={SELECT_CLASS}>
                {(["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"] as Justify[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Align items">
              <select value={alignItems} onChange={(e) => setAlignItems(e.target.value as AlignItems)} className={SELECT_CLASS}>
                {(["stretch", "flex-start", "flex-end", "center", "baseline"] as AlignItems[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            {wrap !== "nowrap" && (
              <Field label="Align content">
                <select value={alignContent} onChange={(e) => setAlignContent(e.target.value as AlignContent)} className={SELECT_CLASS}>
                  {(["stretch", "flex-start", "flex-end", "center", "space-between", "space-around"] as AlignContent[]).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLASS}>Gap</label>
              <span className="text-[10px] font-mono text-[#a855f7]">{gap}px</span>
            </div>
            <input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-[#a855f7]" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={LABEL_CLASS}>Items</label>
              <span className="text-[10px] font-mono text-[#a855f7]">{itemCount}</span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              value={itemCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setItemCount(n);
                if (selected >= n) setSelected(n - 1);
              }}
              className="w-full accent-[#a855f7]"
            />
          </div>

          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
            <Field label={`Selected item: #${selected + 1}`}>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: itemCount }, (_, i) => (
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
            <Field label="align-self">
              <select value={selfAlign} onChange={(e) => setSelfAlign(e.target.value as AlignSelf)} className={SELECT_CLASS}>
                {(["auto", "flex-start", "flex-end", "center", "stretch", "baseline"] as AlignSelf[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLASS}>flex-grow</label>
                <span className="text-[10px] font-mono text-[#a855f7]">{selfGrow}</span>
              </div>
              <input type="range" min={0} max={5} value={selfGrow} onChange={(e) => setSelfGrow(Number(e.target.value))} className="w-full accent-[#a855f7]" />
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
              display: "flex",
              flexDirection: direction,
              flexWrap: wrap,
              justifyContent: justify,
              alignItems: alignItems,
              alignContent: wrap !== "nowrap" ? alignContent : undefined,
              gap: `${gap}px`,
              background: "repeating-conic-gradient(#151515 0% 25%, #0a0a0a 0% 50%) 50% / 20px 20px",
            }}
          >
            {Array.from({ length: itemCount }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-[6px] text-sm font-mono font-semibold"
                style={{
                  width: direction.startsWith("row") ? 72 : 120,
                  height: direction.startsWith("row") ? 72 : 48,
                  flexShrink: 0,
                  background: i === selected ? "#a855f7" : "#2a2a35",
                  color: i === selected ? "#fff" : "#a1a1aa",
                  alignSelf: i === selected && selfAlign !== "auto" ? selfAlign : undefined,
                  flexGrow: i === selected ? selfGrow : 0,
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
