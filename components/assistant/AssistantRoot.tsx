"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { OPEN_ASSISTANT_EVENT, ASSISTANT_VIEW_EVENT, SHOWCASE_SEEN_KEY, isShowcaseActive, openAssistant } from "@/lib/showcase";

const LaunchShowcase = dynamic(() => import("./LaunchShowcase"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

// Loads the assistant bundle only once the page is idle (or the moment someone asks for it),
// so it never competes with the page's own content for load time.
export default function AssistantRoot() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const onView = (e: Event) => setAssistantOpen(Boolean((e as CustomEvent<{ open: boolean }>).detail?.open));
    window.addEventListener(ASSISTANT_VIEW_EVENT, onView);
    return () => window.removeEventListener(ASSISTANT_VIEW_EVENT, onView);
  }, []);

  useEffect(() => {
    if (ready) return; // once loaded, LaunchShowcase listens for open requests itself
    const onOpen = () => {
      setOpenOnLoad(true);
      setReady(true);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);

    // Auto-load only when the showcase still has to appear this visit; otherwise wait for a click
    let seen = true;
    try {
      seen = Boolean(sessionStorage.getItem(SHOWCASE_SEEN_KEY));
    } catch {}
    if (!isShowcaseActive() || seen) {
      return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    }

    const w = window as IdleWindow;
    const load = () => setReady(true);
    // Safari has no requestIdleCallback
    const useIdle = typeof w.requestIdleCallback === "function";
    const handle = useIdle ? w.requestIdleCallback!(load, { timeout: 2500 }) : window.setTimeout(load, 1500);
    return () => {
      window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
      if (useIdle) w.cancelIdleCallback?.(handle);
      else clearTimeout(handle);
    };
  }, [ready]);

  // Always-visible launcher, except on /ask (already there) and while the card or overlay is up
  const showLauncher = pathname !== "/ask" && !pathname.startsWith("/admin") && !assistantOpen;

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {showLauncher && (
        <button
          onClick={openAssistant}
          aria-label="Ask Ninja — paste anything"
          className="group fixed bottom-9 right-4 sm:right-6 z-40 flex items-center gap-2 pl-2 pr-3.5 py-2 bg-[#0d0d0f]/90 backdrop-blur border border-[#a855f7]/40 hover:border-[#a855f7] rounded-full shadow-lg shadow-[#a855f7]/20 hover:shadow-[#a855f7]/40 transition-all animate-slide-up"
        >
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#a855f7]/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={20} height={17} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
          </span>
          <span className="text-sm font-medium text-[#f5f5f5] group-hover:text-white">Ask Ninja</span>
          <Sparkles size={13} className="text-[#a855f7]" />
        </button>
      )}
      {ready && <LaunchShowcase openOnLoad={openOnLoad} />}
    </>
  );
}
