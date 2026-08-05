"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { tools, LATEST_TOOL_SLUGS } from "@/lib/tools";
import * as LucideIcons from "lucide-react";
import { X, Sparkles } from "lucide-react";

const SEEN_KEY = "toolninja_whats_new_seen";

function ToolIcon({ name }: { name: string }) {
  const Icon = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  )[name];
  if (!Icon) return null;
  return <Icon size={18} className="text-[#a855f7]" />;
}

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const currentVersion = LATEST_TOOL_SLUGS.join(",");
      const seenVersion = localStorage.getItem(SEEN_KEY);
      if (seenVersion !== currentVersion) {
        const timer = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, LATEST_TOOL_SLUGS.join(","));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const latestTools = LATEST_TOOL_SLUGS.map((slug) => tools.find((t) => t.slug === slug)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t)
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="What's new"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#111111] border border-[#222222] rounded-[12px] shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#a855f7]" />
            <h2 className="text-sm font-semibold text-[#f5f5f5]">What&apos;s new on ToolNinja</h2>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="text-[#555555] hover:text-[#f5f5f5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {latestTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              onClick={dismiss}
              className="flex items-start gap-3 p-3 rounded-[8px] hover:bg-[#1a1a1a] transition-colors group"
            >
              <div className="p-2 bg-[#1a1a1a] rounded-[6px] group-hover:bg-[#a855f7]/10 transition-colors shrink-0">
                <ToolIcon name={tool.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors">
                  {tool.name}
                </p>
                <p className="text-xs text-[#888888] leading-relaxed">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#1a1a1a]">
          <button
            onClick={dismiss}
            className="w-full py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
