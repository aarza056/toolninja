"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const STORAGE_KEY = "toolninja:css-carousel-generator";

interface Settings {
  slideCount: number;
  slideWidth: number;
  gap: number;
  accentColor: string;
  markerPosition: "before" | "after" | "none";
  includeButtons: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  slideCount: 5,
  slideWidth: 240,
  gap: 16,
  accentColor: "#a855f7",
  markerPosition: "after",
  includeButtons: true,
};

function buildHtml(s: Settings): string {
  const items = Array.from({ length: s.slideCount }, (_, i) => `    <li class="carousel-item">Slide ${i + 1}</li>`).join("\n");
  return `<ul class="carousel">\n${items}\n</ul>`;
}

function buildCss(s: Settings): string {
  const lines = [
    ".carousel {",
    "  display: flex;",
    "  overflow-x: auto;",
    "  scroll-snap-type: x mandatory;",
    `  gap: ${s.gap}px;`,
    "  list-style: none;",
    "  padding: 0;",
    "  margin: 0;",
  ];
  if (s.markerPosition !== "none") lines.push(`  scroll-marker-group: ${s.markerPosition};`);
  lines.push("}", "", ".carousel-item {", "  scroll-snap-align: start;", "  flex: 0 0 auto;", `  width: ${s.slideWidth}px;`, "}");

  if (s.markerPosition !== "none") {
    lines.push(
      "",
      "/* Auto-generated dot navigation — one ::scroll-marker per item, grouped by ::scroll-marker-group */",
      ".carousel::scroll-marker-group {",
      "  display: flex;",
      "  gap: 8px;",
      "  justify-content: center;",
      "  margin-top: 12px;",
      "}",
      ".carousel-item::scroll-marker {",
      '  content: "";',
      "  width: 10px;",
      "  height: 10px;",
      "  border-radius: 50%;",
      "  background: #333333;",
      "  cursor: pointer;",
      "}",
      ".carousel-item::scroll-marker:target-current {",
      `  background: ${s.accentColor};`,
      "}"
    );
  }

  if (s.includeButtons) {
    lines.push(
      "",
      "/* Prev/next buttons — browsers without support simply won't render them (progressive enhancement) */",
      ".carousel::scroll-button(left) {",
      '  content: "←";',
      "}",
      ".carousel::scroll-button(right) {",
      '  content: "→";',
      "}",
      ".carousel::scroll-button(left),",
      ".carousel::scroll-button(right) {",
      "  position: absolute;",
      `  color: ${s.accentColor};`,
      "  cursor: pointer;",
      "}"
    );
  }

  return lines.join("\n");
}

export default function CssCarouselGeneratorClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const html = buildHtml(settings);
  const css = buildCss(settings);

  const inputClass =
    "w-full px-2.5 py-1.5 text-sm bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="CSS Scroll Carousel Generator"
      description="Build a zero-JavaScript carousel with dot navigation using ::scroll-marker and scroll-snap"
    >
      <div className="mb-3 p-2.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[6px] text-xs text-[#f59e0b]">
        ::scroll-marker, ::scroll-marker-group, and ::scroll-button() have full support in Chrome/Edge
        135+ and Safari 19+ as of 2026, but remain behind a flag in Firefox. The carousel still scrolls
        and snaps everywhere via plain scroll-snap-type — only the generated dots/buttons are
        progressive enhancement.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Slides ({settings.slideCount})</label>
            <input
              type="range"
              min={2}
              max={10}
              value={settings.slideCount}
              onChange={(e) => update("slideCount", Number(e.target.value))}
              className="w-full accent-[#a855f7]"
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Slide width ({settings.slideWidth}px)</label>
            <input
              type="range"
              min={120}
              max={400}
              step={10}
              value={settings.slideWidth}
              onChange={(e) => update("slideWidth", Number(e.target.value))}
              className="w-full accent-[#a855f7]"
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Gap ({settings.gap}px)</label>
            <input
              type="range"
              min={0}
              max={48}
              value={settings.gap}
              onChange={(e) => update("gap", Number(e.target.value))}
              className="w-full accent-[#a855f7]"
            />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Accent color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => update("accentColor", e.target.value)}
                className="w-9 h-9 rounded-[6px] border border-[#222222] bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => update("accentColor", e.target.value)}
                spellCheck={false}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Dot markers</label>
            <div className="flex">
              {(["before", "after", "none"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => update("markerPosition", pos)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    settings.markerPosition === pos
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#cccccc] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.includeButtons}
              onChange={(e) => update("includeButtons", e.target.checked)}
              className="w-3.5 h-3.5 accent-[#a855f7]"
            />
            Prev/next buttons
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-[#888888] font-medium mb-1">Live preview</p>
            <div className="p-4 bg-[#0d0d0d] border border-[#222222] rounded-[8px]">
              <div
                className="flex overflow-x-auto"
                style={{ gap: `${settings.gap}px`, scrollSnapType: "x mandatory" } as React.CSSProperties}
              >
                {Array.from({ length: settings.slideCount }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-none h-28 rounded-[6px] flex items-center justify-center text-sm font-medium text-white shrink-0"
                    style={{
                      width: `${settings.slideWidth}px`,
                      background: `${settings.accentColor}${(30 + i * 10).toString(16)}`,
                      scrollSnapAlign: "start",
                    } as React.CSSProperties}
                  >
                    Slide {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#555555] mt-2">
                Preview shows the scroll-snap behavior only — dots/buttons need the generated CSS below
                rendered by a browser that supports them.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">HTML</label>
              <CopyButton text={html} size="sm" />
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
              {html}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">CSS</label>
              <CopyButton text={css} size="sm" />
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap">
              {css}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
