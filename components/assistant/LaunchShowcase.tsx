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
    // A visit that starts on /ask is already using Ninja — no need to announce it
    if (!openOnLoad && pathname !== "/ask") setView(pathname === "/" ? "overlay" : "corner");
    // Only the first page of a visit decides the variant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setView("none");
    setMode("idle");
  }, []);

  // Navigating away by any other route (back button, a link outside) also puts Ninja away
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    if (view !== "none") setView("none");
  }

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

  // Any link inside the overlay (a suggested tool, a guide) closes it and navigates. Checked on click
  // rather than on route change so a link to the page you're already on still closes it.
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab: keep Ninja open
    if ((e.target as Element).closest("a[href]")) close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask Ninja"
      onClick={onOverlayClick}
      className="fixed inset-0 z-[70] bg-[#060607]/[0.97] backdrop-blur-md"
    >
      {/* Only this layer scrolls — the cloud, the header fade and the close button stay put */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-[calc(17vh+100px)] pb-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-2">Paste anything. Ask anything.</h2>
          <p className="text-center text-sm text-[#888888] mb-6 max-w-lg mx-auto">
            Drop in a token, a certificate, an error, a screenshot — or describe your problem. Ninja tells you what it is and which of
            our tools solves it.
          </p>
          <AssistantPanel onCloudMode={setMode} autoFocus />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[calc(17vh+96px)] bg-gradient-to-b from-[#060607] via-[#060607]/95 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-20">
        <ParticleCloud mode={mode} gather centerY={0.17} radius={82} count={130} />
      </div>
      <div className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#c4a5f7]">
            <Sparkles size={13} /> Ask Ninja
          </span>
          <button
            onClick={close}
            aria-label="Close Ask Ninja"
            className="flex items-center gap-2 pl-3.5 pr-2 py-1.5 text-sm font-medium text-[#f5f5f5] bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] hover:border-[#a855f7]/60 rounded-full shadow-lg shadow-black/40 transition-colors"
          >
            Close
            <kbd className="hidden sm:inline text-[10px] font-normal text-[#a1a1aa] bg-[#0d0d0f] border border-[#3f3f46] px-1.5 py-0.5 rounded">Esc</kbd>
            <X size={15} className="sm:hidden" />
          </button>
        </div>
      </div>
    </div>
  );
}
