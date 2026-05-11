"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, Copy, Check } from "lucide-react";
import type { Animation } from "@/lib/animations";

interface Props {
  animation: Animation;
  onPreview: () => void;
}

/**
 * Scopes animation CSS to a specific container ID so multiple animations
 * can coexist on the same page without class name collisions.
 * - Prefixes `.class` → `#containerId .class`
 * - @keyframes and @property names are already unique per animation
 */
function scopeCSS(css: string, containerId: string): string {
  return css.replace(
    /(?<![#.\w-])\.([a-zA-Z][\w-]*)/g,
    `#${containerId} .$1`
  );
}

function InlinePreview({ animation }: { animation: Animation }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const id = `ap-${animation.id}`;
    container.id = id;

    const scoped = scopeCSS(animation.css, id);
    const style = document.createElement("style");
    style.textContent = scoped;
    document.head.appendChild(style);
    styleRef.current = style;

    container.innerHTML = animation.html;

    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, [animation]);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-content-center w-full h-full"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    />
  );
}

export default function AnimationCard({ animation, onPreview }: Props) {
  const [copied, setCopied] = useState(false);
  const height = animation.previewHeight ?? 140;
  const combinedCode = `<!-- Paste this anywhere -->\n<style>\n${animation.css}\n</style>\n${animation.html}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedCode);
    } catch {
      const el = document.createElement("textarea");
      el.value = combinedCode;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden flex flex-col hover:border-[#a855f7]/40 transition-colors">
      {/* Live preview — native DOM, no iframe overhead */}
      <div
        className="relative overflow-hidden bg-[#0a0a0a] flex-shrink-0"
        style={{ height }}
      >
        <InlinePreview animation={animation} />
      </div>

      {/* Info bar */}
      <div className="p-3 flex items-start justify-between gap-2 border-t border-[#222222]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-[#f5f5f5] truncate">
              {animation.name}
            </span>
            {animation.isNew && (
              <span className="text-[10px] font-bold bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 rounded px-1.5 py-0.5 flex-shrink-0">
                NEW
              </span>
            )}
          </div>
          <span className="text-xs text-[#888888] mt-0.5 block">
            {animation.category}
          </span>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={onPreview}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222] text-[#f5f5f5] border border-[#222] rounded-md transition-colors"
          >
            <Eye size={12} />
            Preview
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-colors border ${
              copied
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30"
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
