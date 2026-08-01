"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { slugify, type SlugifyOptions } from "@/lib/slugify";

const STORAGE_KEY = "toolninja:slug-generator";

export default function SlugGeneratorClient() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<SlugifyOptions["separator"]>("-");
  const [lowercase, setLowercase] = useState(true);
  const [maxLength, setMaxLength] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const lines = useMemo(
    () => input.split("\n").map((l) => l.trim()).filter(Boolean),
    [input]
  );

  const slugs = useMemo(
    () => lines.map((line) => slugify(line, { separator, lowercase, maxLength: maxLength || undefined })),
    [lines, separator, lowercase, maxLength]
  );

  const SegButton = <T extends string>({
    value, current, onClick, children,
  }: { value: T; current: T; onClick: (v: T) => void; children: React.ReactNode }) => (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 text-sm border transition-colors first:rounded-l-[6px] last:rounded-r-[6px] ${
        value === current
          ? "bg-[#a855f7] border-[#a855f7] text-white"
          : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
      }`}
    >
      {children}
    </button>
  );

  return (
    <ToolLayout title="Slug Generator" description="Turn titles into clean, URL-safe slugs — one per line, batch supported">
      {/* Options */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Separator</label>
          <div className="flex">
            <SegButton value="-" current={separator} onClick={setSeparator}>hyphen -</SegButton>
            <SegButton value="_" current={separator} onClick={setSeparator}>underscore _</SegButton>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#888888] pb-2">
          <input type="checkbox" checked={lowercase} onChange={(e) => setLowercase(e.target.checked)} className="accent-[#a855f7]" />
          Lowercase
        </label>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Max length (optional)</label>
          <input
            type="number"
            min={0}
            value={maxLength || ""}
            onChange={(e) => setMaxLength(Number(e.target.value) || 0)}
            placeholder="No limit"
            className="w-32 px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">
            Titles / text {lines.length > 1 && `(${lines.length} lines)`}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"How to Convert cURL Commands to Python\nCafé du Monde — Best Beignets in NOLA"}
            rows={14}
            spellCheck={false}
            className="w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Slugs</label>
            {slugs.length > 0 && <CopyButton text={slugs.join("\n")} size="sm" label="Copy all" />}
          </div>
          {slugs.length > 0 ? (
            <div className="space-y-1.5">
              {slugs.map((slug, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] group">
                  <code className="flex-1 text-sm font-mono text-[#f5f5f5] break-all">{slug}</code>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={slug} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
              Type a title above to generate its slug
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
