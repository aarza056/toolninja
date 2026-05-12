"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

export default function ParticleBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particleCount =
    typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 80;

  const particlesOptions: ISourceOptions = {
    background: {
      color: { value: "transparent" },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
      },
      modes: {
        grab: {
          distance: 160,
          links: { opacity: 0.3 },
        },
        push: {
          quantity: 3,
        },
      },
    },
    particles: {
      color: {
        value: "#a855f7",
      },
      links: {
        color: "#a855f7",
        distance: 150,
        enable: true,
        opacity: 0.06,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "bounce" },
      },
      number: {
        value: particleCount,
        density: {
          enable: true,
        },
      },
      opacity: {
        value: { min: 0.07, max: 0.28 },
        animation: {
          enable: true,
          speed: 0.8,
        },
      },
      shape: { type: "circle" },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  };

  if (!init) return null;

  return (
    <div style={{ opacity: 0.7, pointerEvents: "none" }}>
      <Particles
        id="tsparticles"
        options={particlesOptions}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
