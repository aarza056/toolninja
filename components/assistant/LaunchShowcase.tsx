"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import ParticleCloud, { type CloudMode } from "./ParticleCloud";

// The panel (detectors, markdown, parsers) only loads when the full assistant actually opens
const AssistantPanel = dynamic(() => import("./AssistantPanel"), {
  ssr: false,
  loading: () => <div className="h-[180px] rounded-[14px] border border-[#2a2a2e] bg-[#0d0d0f]/90 animate-pulse" />,
});
import { isShowcaseActive, SHOWCASE_SEEN_KEY, OPEN_ASSISTANT_EVENT } from "@/lib/showcase";

type View = "none" | "overlay" | "corner";

const BOT_UA = /bot|crawler|spider|crawling|lighthouse|headless|slurp|bingpreview|facebookexternalhit/i;

export default function LaunchShowcase({ openOnLoad = false }: { openOnLoad?: boolean }) {
  const pathname = usePathname();
  const [view, setView] = useState<View>(openOnLoad ? "overlay" : "none");
  const [mode, setMode] = useState<CloudMode>("idle");

  useEffect(() => {
    const open = () => setView("overlay");
    window.addEventListener(OPEN_ASSISTANT_EVENT, open);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, open);
  }, []);

  // Once per visit during the showcase window: full screen if the visit starts on the homepage,
  // a corner card if it starts on a tool page (people arriving from search came for that tool).
  useEffect(() => {
    if (!isShowcaseActive() || BOT_UA.test(navigator.userAgent)) return;
    try {
      if (sessionStorage.getItem(SHOWCASE_SEEN_KEY)) return;
      sessionStorage.setItem(SHOWCASE_SEEN_KEY, "1");
    } catch {
      return;
    }
    if (!openOnLoad) setView(pathname === "/" ? "overlay" : "corner");
    // Only the first page of a visit decides the variant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setView("none");
    setMode("idle");
  }, []);

  useEffect(() => {
    if (view !== "overlay") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [view, close]);

  if (view === "corner") {
    return (
      <div className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[min(340px,calc(100vw-2rem))] overflow-hidden bg-[#0d0d0f]/95 backdrop-blur border border-[#a855f7]/30 rounded-[14px] shadow-2xl shadow-[#a855f7]/10 animate-slide-up">
        <div className="relative h-[120px]">
          <ParticleCloud mode="idle" radius={44} count={60} />
          <button onClick={close} aria-label="Close" className="absolute top-2 right-2 p-1 text-[#666666] hover:text-[#f5f5f5]">
            <X size={15} />
          </button>
        </div>
        <div className="px-4 pb-4 -mt-2">
          <p className="text-sm font-semibold text-[#f5f5f5] mb-1">New: paste anything</p>
          <p className="text-xs text-[#888888] leading-relaxed mb-3">
            JWTs, certificates, cron, errors, cURL… Ninja tells you what it is and which tool to use — instantly, in your browser.
          </p>
          <button
            onClick={() => setView("overlay")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[8px] transition-colors"
          >
            <Sparkles size={14} /> Try it
          </button>
        </div>
      </div>
    );
  }

  if (view !== "overlay") return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Ask Ninja" className="fixed inset-0 z-[70] overflow-y-auto bg-[#060607]/[0.97] backdrop-blur-md">
      <div className="pointer-events-none fixed inset-0">
        <ParticleCloud mode={mode} gather centerY={0.17} radius={82} count={130} />
      </div>
      <button
        onClick={close}
        aria-label="Close"
        className="fixed top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] bg-[#111111]/80 border border-[#222222] rounded-full transition-colors"
      >
        Skip <X size={13} />
      </button>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-[calc(17vh+100px)] pb-16">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-2">Paste anything. Ask anything.</h2>
        <p className="text-center text-sm text-[#888888] mb-6 max-w-lg mx-auto">
          Drop in a token, a certificate, an error, a screenshot — or describe your problem. Ninja tells you what it is and which of our
          tools solves it.
        </p>
        <AssistantPanel onCloudMode={setMode} autoFocus />
      </div>
    </div>
  );
}
