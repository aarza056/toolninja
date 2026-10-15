"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/ads";

interface AdSlotProps {
  slot: string;
  minHeight?: number;
  className?: string;
  format?: string;
  layout?: "in-article";
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

// Reserves space for the ad (prevents CLS) and lazy-loads via IntersectionObserver so
// below-the-fold slots don't request an ad until they're near the viewport.
// Renders nothing outside production, and nothing for an unconfigured placeholder slot.
export default function AdSlot({ slot, minHeight = 250, className = "", format = "auto", layout }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet or blocked — safe to ignore
    }
  }, [inView]);

  if (process.env.NODE_ENV !== "production") return null;
  if (!slot || /^0+$/.test(slot)) return null;

  return (
    <div ref={containerRef} className={`w-full flex items-center justify-center overflow-hidden ${className}`} style={{ minHeight }}>
      {inView && layout === "in-article" && (
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center", width: "100%" }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
        />
      )}
      {inView && layout !== "in-article" && (
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
