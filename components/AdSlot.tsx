"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  minHeight?: number;
  className?: string;
}

// Reserves space for a future ad unit (prevents CLS once one is wired in) and lazy-triggers
// via IntersectionObserver so below-the-fold slots don't load until near the viewport.
// Renders nothing outside production. No ad network markup is mounted yet.
//
// Placement rules: never put an AdSlot inside ToolLayout's content (between a tool's inputs and
// outputs). Place it after the tool, e.g. above or below ToolSeoSection, so an ad can't be
// mistaken for tool output or shift an input while someone is typing. The reserved minHeight
// should match the unit's height, and the "Advertisement" label stays visible above every unit.
export default function AdSlot({ minHeight = 250, className = "" }: AdSlotProps) {
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

  if (process.env.NODE_ENV !== "production") return null;

  return (
    <aside aria-label="Advertisement" className={`w-full ${className}`}>
      <p className="text-[10px] uppercase tracking-widest text-[#888888] mb-1">Advertisement</p>
      <div
        ref={containerRef}
        data-ad-slot=""
        data-ad-in-view={inView}
        className="w-full flex items-center justify-center overflow-hidden"
        style={{ minHeight }}
      >
        {/* Ad unit mounts here once a placement is decided */}
      </div>
    </aside>
  );
}
