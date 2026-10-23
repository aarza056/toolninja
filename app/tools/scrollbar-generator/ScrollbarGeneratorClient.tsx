"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const STORAGE_KEY = "toolninja:scrollbar-generator";

type Width = "auto" | "thin" | "none";

interface Settings {
  width: Width;
  thumbColor: string;
  trackColor: string;
  thumbRadius: number;
  thumbSizePx: number;
  includeWebkit: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  width: "thin",
  thumbColor: "#a855f7",
  trackColor: "#111111",
  thumbRadius: 8,
  thumbSizePx: 10,
  includeWebkit: true,
};

function buildCss(s: Settings, selector: string): string {
  const lines: string[] = [`${selector} {`, `  scrollbar-width: ${s.width};`];
  if (s.width !== "none") {
    lines.push(`  scrollbar-color: ${s.thumbColor} ${s.trackColor};`);
  }
  lines.push(`}`);

  if (s.includeWebkit) {
    lines.push(
      "",
      `/* Chromium/Safari fallback — scrollbar-width/color alone don't cover every browser yet */`,
      `${selector}::-webkit-scrollbar {`,
      `  width: ${s.width === "none" ? "0px" : `${s.thumbSizePx}px`};`,
      `  height: ${s.width === "none" ? "0px" : `${s.thumbSizePx}px`};`,
      `}`
    );
    if (s.width !== "none") {
      lines.push(
        `${selector}::-webkit-scrollbar-track {`,
        `  background: ${s.trackColor};`,
        `}`,
        `${selector}::-webkit-scrollbar-thumb {`,
        `  background: ${s.thumbColor};`,
        `  border-radius: ${s.thumbRadius}px;`,
        `}`
      );
    }
  }

  return lines.join("\n");
}

export default function ScrollbarGeneratorClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [selector, setSelector] = useState(".scroll-container");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (parsed.selector) setSelector(parsed.selector);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, selector }));
    } catch {}
  }, [settings, selector]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const css = buildCss(settings, selector);

  const inputClass =
    "w-full px-2.5 py-1.5 text-sm bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="CSS Scrollbar Generator"
      description="Style scrollbars with the modern scrollbar-color/width properties, plus a WebKit fallback"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">CSS selector</label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value || ".scroll-container")}
              spellCheck={false}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">scrollbar-width</label>
            <div className="flex">
              {(["auto", "thin", "none"] as Width[]).map((w) => (
                <button
                  key={w}
                  onClick={() => update("width", w)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    settings.width === w
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {settings.width !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#888888] font-medium block mb-1">Thumb color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.thumbColor}
                      onChange={(e) => update("thumbColor", e.target.value)}
                      className="w-9 h-9 rounded-[6px] border border-[#222222] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.thumbColor}
                      onChange={(e) => update("thumbColor", e.target.value)}
                      spellCheck={false}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#888888] font-medium block mb-1">Track color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.trackColor}
                      onChange={(e) => update("trackColor", e.target.value)}
                      className="w-9 h-9 rounded-[6px] border border-[#222222] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.trackColor}
                      onChange={(e) => update("trackColor", e.target.value)}
                      spellCheck={false}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">
                  WebKit thumb radius ({settings.thumbRadius}px)
                </label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={settings.thumbRadius}
                  onChange={(e) => update("thumbRadius", Number(e.target.value))}
                  className="w-full accent-[#a855f7]"
                />
              </div>

              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">
                  WebKit thickness ({settings.thumbSizePx}px)
                </label>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={settings.thumbSizePx}
                  onChange={(e) => update("thumbSizePx", Number(e.target.value))}
                  className="w-full accent-[#a855f7]"
                />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-[#cccccc] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.includeWebkit}
              onChange={(e) => update("includeWebkit", e.target.checked)}
              className="w-3.5 h-3.5 accent-[#a855f7]"
            />
            Include ::-webkit-scrollbar fallback
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-[#888888] font-medium mb-1">Live preview</p>
            <div
              className="h-48 overflow-y-scroll rounded-[8px] border border-[#222222] p-4 bg-[#0d0d0d]"
              style={
                {
                  scrollbarWidth: settings.width,
                  scrollbarColor: settings.width !== "none" ? `${settings.thumbColor} ${settings.trackColor}` : undefined,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <p key={i} className="text-sm text-[#666666] mb-2">
                  Scrollable content line {i + 1}
                </p>
              ))}
            </div>
            <p className="text-[10px] text-[#555555] mt-1">
              Preview reflects the standard scrollbar-width/color properties (Firefox and modern
              Chromium) — the WebKit fallback below won&apos;t render identically in every browser.
            </p>
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
