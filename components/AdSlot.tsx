"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  minHeight?: number;
  className?: string;
}

// Reserves space for a future ad unit (prevents CLS once one is wired in) and lazy-triggers
// via IntersectionObserver so below-the-fold slots don't load until near the viewport.
// Renders nothing outside production. No ad network markup is mounted yet.
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
    <div
      ref={containerRef}
      data-ad-slot=""
      data-ad-in-view={inView}
      className={`w-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Ad unit mounts here once a placement is decided */}
    </div>
  );
}
