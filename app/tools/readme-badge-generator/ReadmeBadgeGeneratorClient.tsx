"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  buildBadgeUrl,
  buildMarkdown,
  buildHtml,
  DYNAMIC_BADGE_PRESETS,
  type BadgeStyle,
} from "@/lib/badge-generator";

const STYLES: BadgeStyle[] = ["flat", "flat-square", "plastic", "for-the-badge", "social"];
const COLOR_PRESETS = ["brightgreen", "green", "yellowgreen", "yellow", "orange", "red", "blue", "lightgrey", "success", "critical", "informational"];

type Mode = "custom" | "repo";

export default function ReadmeBadgeGeneratorClient() {
  const [mode, setMode] = useState<Mode>("custom");
  const [label, setLabel] = useState("build");
  const [message, setMessage] = useState("passing");
  const [color, setColor] = useState("brightgreen");
  const [style, setStyle] = useState<BadgeStyle>("flat");
  const [linkUrl, setLinkUrl] = useState("");

  const [owner, setOwner] = useState("vercel");
  const [repo, setRepo] = useState("next.js");

  const customBadgeUrl = useMemo(
    () => buildBadgeUrl({ label, message, color, style }),
    [label, message, color, style]
  );
  const customMarkdown = useMemo(
    () => buildMarkdown(customBadgeUrl, `${label} ${message}`, linkUrl || undefined),
    [customBadgeUrl, label, message, linkUrl]
  );
  const customHtml = useMemo(
    () => buildHtml(customBadgeUrl, `${label} ${message}`, linkUrl || undefined),
    [customBadgeUrl, label, message, linkUrl]
  );

  return (
    <ToolLayout
      title="README Badge Generator"
      description="Build shields.io badges for your README — custom text badges or live repo stats"
    >
      <div className="flex mb-5">
        <button
          onClick={() => setMode("custom")}
          className={`px-4 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
            mode === "custom" ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
          }`}
        >
          Custom Badge
        </button>
        <button
          onClick={() => setMode("repo")}
          className={`px-4 py-2 text-sm border border-l-0 first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
            mode === "repo" ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
          }`}
        >
          Repo / Package Badges
        </button>
      </div>

      {mode === "custom" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Label</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Message</label>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1.5">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors ${
                      color === c ? "border-[#a855f7] text-[#a855f7] bg-[#a855f7]/10" : "border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="or hex, e.g. ff69b4"
                  className="w-32 px-2 py-1 text-xs font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1.5">Style</label>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors ${
                      style === s ? "border-[#a855f7] text-[#a855f7] bg-[#a855f7]/10" : "border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Link URL (optional)</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://github.com/you/repo"
                className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-2">Preview</label>
              <div className="p-6 bg-[#111111] border border-[#222222] rounded-[8px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customBadgeUrl} alt={`${label} ${message}`} className="max-w-full" />
              </div>
              <p className="text-[10px] text-[#555555] mt-1">Fetched live from img.shields.io for an accurate preview.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">Markdown</label>
                <CopyButton text={customMarkdown} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all">{customMarkdown}</pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">HTML</label>
                <CopyButton text={customHtml} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all">{customHtml}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-5 max-w-md">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Owner / npm scope</label>
              <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Repo / package name</label>
              <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
            </div>
          </div>

          <div className="space-y-3">
            {DYNAMIC_BADGE_PRESETS.map((preset) => {
              const url = preset.buildUrl(owner, repo);
              const link = preset.buildLink?.(owner, repo);
              const markdown = buildMarkdown(url, preset.altText, link);
              return (
                <div key={preset.id} className="flex flex-wrap items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={preset.altText} className="shrink-0" />
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-xs text-[#f5f5f5] font-medium">{preset.label}</p>
                    <p className="text-[10px] text-[#555555]">{preset.description}</p>
                  </div>
                  <CopyButton text={markdown} size="sm" label="Copy Markdown" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
