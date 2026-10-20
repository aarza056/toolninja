"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OPEN_ASSISTANT_EVENT, SHOWCASE_SEEN_KEY, isShowcaseActive } from "@/lib/showcase";

const LaunchShowcase = dynamic(() => import("./LaunchShowcase"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

// Loads the assistant bundle only once the page is idle (or the moment someone asks for it),
// so it never competes with the page's own content for load time.
export default function AssistantRoot() {
  const [ready, setReady] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

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

  return ready ? <LaunchShowcase openOnLoad={openOnLoad} /> : null;
}
