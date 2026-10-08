"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The particle background is decorative and its engine is the largest script on every page.
// Load it only after the page is idle, and skip it on small screens and for visitors who ask for
// reduced motion, so it never competes with the tool itself for the main thread.
const ParticleBackground = dynamic(() => import("./ParticleBackground"), { ssr: false });

export default function DeferredParticles() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => setShow(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(start, 2000);
    return () => clearTimeout(timer);
  }, []);

  return show ? <ParticleBackground /> : null;
}
