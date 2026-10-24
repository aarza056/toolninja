"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, SlidersHorizontal } from "lucide-react";
import type { Animation } from "@/lib/animations";
import { customizeCss, toTailwindTheme, DEFAULT_ANIMATION_OPTIONS, EASINGS, type AnimationOptions } from "@/lib/animation-customize";

interface Props {
  animation: Animation | null;
  onClose: () => void;
}

type Tab = "combined" | "html" | "css" | "tailwind";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const DELAYS = [0, 150, 300, 600, 1000];
const selectClass = "w-full px-2 py-1.5 text-xs bg-[#0a0a0a] border border-[#222222] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-[#777777] mb-1">{label}</span>
      {children}
    </label>
  );
}

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
  const [opts, setOpts] = useState<AnimationOptions>(DEFAULT_ANIMATION_OPTIONS);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    if (animation) {
      requestAnimationFrame(() => setVisible(true));
      setTab("combined");
      setOpts(DEFAULT_ANIMATION_OPTIONS);
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

  const css = customizeCss(animation.css, opts);
  const isScroll = /animation-timeline\s*:/.test(animation.css);
  const combinedCode = `<!-- Paste this anywhere -->\n<style>\n${css}\n</style>\n${animation.html}`;
  const codeMap: Record<Tab, string> = {
    html: animation.html,
    css,
    combined: combinedCode,
    tailwind: toTailwindTheme(customizeCss(animation.css, { ...opts, reducedMotion: false })) ?? "/* This preset has no @keyframes — it animates with transitions, so there's nothing to register in @theme. */",
  };
  const set = <K extends keyof AnimationOptions>(k: K, v: AnimationOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const changed = JSON.stringify(opts) !== JSON.stringify(DEFAULT_ANIMATION_OPTIONS);

  // The preview ignores the OS reduced-motion setting so you can always see the animation
  const previewDoc = buildPreviewDoc(customizeCss(animation.css, { ...opts, reducedMotion: false }), animation.html);

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
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl transition-all duration-200 ${
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
            key={previewDoc}
            srcDoc={previewDoc}
            className="w-full h-full border-0"
            title={`${animation.name} full preview`}
          />
        </div>

        {/* Customize */}
        <div className="border-t border-[#222222] px-4 py-3">
          <button
            onClick={() => setCustomizing((c) => !c)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#a855f7] hover:text-[#c084fc]"
            aria-expanded={customizing}
          >
            <SlidersHorizontal size={13} /> Customize{changed ? " · edited" : ""}
          </button>
          {customizing && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Speed">
                <select value={opts.speed} onChange={(e) => set("speed", Number(e.target.value))} className={selectClass}>
                  {SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {s}× {s === 1 ? "(original)" : s > 1 ? "faster" : "slower"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Easing">
                <select value={opts.easing} onChange={(e) => set("easing", e.target.value)} className={selectClass}>
                  {EASINGS.map((e) => (
                    <option key={e.label} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Delay">
                <select value={opts.delayMs} disabled={isScroll} onChange={(e) => set("delayMs", Number(e.target.value))} className={selectClass}>
                  {DELAYS.map((d) => (
                    <option key={d} value={d}>
                      {d ? `${d} ms` : "None"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Repeat">
                <select value={opts.iterations} disabled={isScroll} onChange={(e) => set("iterations", e.target.value)} className={selectClass}>
                  <option value="">Preset&apos;s own</option>
                  <option value="1">Once</option>
                  <option value="2">Twice</option>
                  <option value="3">3 times</option>
                  <option value="infinite">Forever</option>
                </select>
              </Field>
              <Field label="Direction">
                <select value={opts.direction} disabled={isScroll} onChange={(e) => set("direction", e.target.value)} className={selectClass}>
                  <option value="">Preset&apos;s own</option>
                  <option value="normal">Normal</option>
                  <option value="reverse">Reverse</option>
                  <option value="alternate">Alternate</option>
                  <option value="alternate-reverse">Alternate reverse</option>
                </select>
              </Field>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-1.5 text-xs text-[#cccccc] cursor-pointer">
                  <input type="checkbox" checked={opts.reducedMotion} onChange={(e) => set("reducedMotion", e.target.checked)} className="accent-[#a855f7]" />
                  Respect reduced motion
                </label>
                {changed && (
                  <button onClick={() => setOpts(DEFAULT_ANIMATION_OPTIONS)} className="text-left text-[11px] text-[#888888] hover:text-[#f5f5f5]">
                    Reset
                  </button>
                )}
              </div>
              {isScroll && <p className="col-span-full text-[11px] text-[#777777]">This one is scroll-driven, so scrolling sets its progress — delay, repeat and direction don&apos;t apply.</p>}
            </div>
          )}
        </div>

        {/* Tabs + Code */}
        <div className="border-t border-[#222222]">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex gap-1">
              {(["combined", "html", "css", "tailwind"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === t
                      ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30"
                      : "text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t === "tailwind" ? "Tailwind v4" : t.charAt(0).toUpperCase() + t.slice(1)}
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
