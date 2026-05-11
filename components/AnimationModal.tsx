"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import type { Animation } from "@/lib/animations";

interface Props {
  animation: Animation | null;
  onClose: () => void;
}

type Tab = "combined" | "html" | "css";

function buildPreviewDoc(css: string, html: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;}
${css}
</style></head><body>${html}</body></html>`;
}

function InlineCopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
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
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
        copied
          ? "bg-green-500/10 text-green-400 border-green-500/30"
          : "bg-[#1a1a1a] hover:bg-[#222] text-[#f5f5f5] border-[#222]"
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function AnimationModal({ animation, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("combined");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (animation) {
      requestAnimationFrame(() => setVisible(true));
      setTab("combined");
    } else {
      setVisible(false);
    }
  }, [animation]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (animation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [animation]);

  if (!animation) return null;

  const combinedCode = `<!-- Paste this anywhere -->\n<style>\n${animation.css}\n</style>\n${animation.html}`;
  const codeMap: Record<Tab, string> = {
    html: animation.html,
    css: animation.css,
    combined: combinedCode,
  };

  const previewDoc = buildPreviewDoc(animation.css, animation.html);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222]">
          <div>
            <h2 className="text-base font-semibold text-[#f5f5f5]">
              {animation.name}
            </h2>
            <span className="text-xs text-[#888888]">{animation.category}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Large Preview */}
        <div className="bg-[#0a0a0a] h-[240px]">
          <iframe
            srcDoc={previewDoc}
            className="w-full h-full border-0"
            title={`${animation.name} full preview`}
          />
        </div>

        {/* Tabs + Code */}
        <div className="border-t border-[#222222]">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex gap-1">
              {(["combined", "html", "css"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === t
                      ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30"
                      : "text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <InlineCopyBtn text={codeMap[tab]} />
          </div>

          <div className="m-4 mt-3 rounded-lg overflow-hidden border border-[#222222]">
            <pre className="bg-[#0a0a0a] text-[#f5f5f5] text-xs p-4 overflow-auto max-h-[200px] font-mono leading-relaxed whitespace-pre">
              <code>{codeMap[tab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
