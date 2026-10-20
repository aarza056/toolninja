"use client";

import { useEffect, useRef } from "react";

export type CloudMode = "idle" | "thinking" | "speaking";

interface Props {
  mode: CloudMode;
  /** Cloud centre as a fraction of the canvas (0–1). */
  centerX?: number;
  centerY?: number;
  /** Cloud radius in CSS pixels. */
  radius?: number;
  /** Start with particles scattered across the canvas and let them swarm into the cloud. */
  gather?: boolean;
  count?: number;
  className?: string;
}

interface Particle {
  angle: number;
  dist: number; // 0–1 share of the cloud radius
  speed: number;
  size: number;
  alpha: number;
  phase: number;
  startX: number;
  startY: number;
}

const PURPLE = [168, 85, 247];
const CYAN = [34, 211, 238];
const GATHER_MS = 1600;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function ParticleCloud({
  mode,
  centerX = 0.5,
  centerY = 0.5,
  radius = 90,
  gather = false,
  count = 110,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      // Square root keeps the density even across the disc instead of piling up in the middle
      dist: Math.sqrt(Math.random()) * 0.95 + 0.05,
      speed: 0.6 + Math.random() * 0.8,
      size: 1 + Math.random() * 2,
      alpha: 0.35 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      startX: Math.random(),
      startY: Math.random(),
    }));

    // Smoothed per-mode parameters so switching modes eases instead of snapping
    const state = { spin: 0.2, glow: 0.35, cyan: 0, wobble: 0.08, voice: 0 };
    const startedAt = performance.now();
    let last = startedAt;
    let raf = 0;
    let spinAngle = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - startedAt) / 1000;
      const m = modeRef.current;

      const target =
        m === "thinking"
          ? { spin: 1.6, glow: 0.75, cyan: 0.55, wobble: 0.16, voice: 0 }
          : m === "speaking"
            ? { spin: 0.45, glow: 0.6, cyan: 0.2, wobble: 0.1, voice: 1 }
            : { spin: 0.2, glow: 0.35, cyan: 0, wobble: 0.08, voice: 0 };
      const k = Math.min(dt * 3, 1);
      state.spin += (target.spin - state.spin) * k;
      state.glow += (target.glow - state.glow) * k;
      state.cyan += (target.cyan - state.cyan) * k;
      state.wobble += (target.wobble - state.wobble) * k;
      state.voice += (target.voice - state.voice) * k;
      spinAngle += state.spin * dt;

      // An irregular "voice" envelope: layered sines read as speech rhythm rather than a metronome
      const voice =
        state.voice * (0.5 * Math.abs(Math.sin(t * 7.3)) + 0.3 * Math.abs(Math.sin(t * 11.9 + 1.7)) + 0.2 * Math.abs(Math.sin(t * 3.1)));
      const breathe = 1 + Math.sin(t * 1.4) * 0.04;
      const scale = breathe + voice * 0.18;

      const cx = width * centerX;
      const cy = height * centerY;
      const gatherT = gather && !reduceMotion ? Math.min((now - startedAt) / GATHER_MS, 1) : 1;
      const g = easeOutCubic(gatherT);

      const color = PURPLE.map((c, i) => Math.round(c + (CYAN[i] - c) * state.cyan));
      const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;

      ctx.clearRect(0, 0, width, height);

      // Core glow
      const glowR = radius * (1.25 + voice * 0.3) * scale;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, `rgba(${rgb}, ${0.32 * state.glow * g})`);
      grad.addColorStop(0.5, `rgba(${rgb}, ${0.12 * state.glow * g})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      const xs = new Float32Array(particles.length);
      const ys = new Float32Array(particles.length);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = p.angle + spinAngle * p.speed;
        // Blobby outline: the radius ripples with angle and time so the cloud never looks like a perfect circle
        const blob = 1 + Math.sin(a * 3 + t * 1.1) * state.wobble + Math.sin(a * 5 - t * 1.7 + p.phase) * state.wobble * 0.6;
        const r = radius * p.dist * blob * scale * (1 + voice * 0.25 * p.dist);
        const homeX = cx + Math.cos(a) * r;
        const homeY = cy + Math.sin(a) * r * 0.82;
        const startX = p.startX * width;
        const startY = p.startY * height;
        xs[i] = startX + (homeX - startX) * g;
        ys[i] = startY + (homeY - startY) * g;
      }

      // Links between nearby particles, like the site background
      const linkDist = radius * 0.55;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = xs[i] - xs[j];
          const dy = ys[i] - ys[j];
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const a = (1 - Math.sqrt(d2) / linkDist) * (0.12 + state.glow * 0.18);
            ctx.strokeStyle = `rgba(${rgb}, ${a})`;
            ctx.beginPath();
            ctx.moveTo(xs[i], ys[i]);
            ctx.lineTo(xs[j], ys[j]);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const twinkle = 0.75 + 0.25 * Math.sin(t * 2 + p.phase);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(xs[i], ys[i], p.size * (1 + voice * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    // Resizing a canvas clears it; with reduced motion there's no animation loop to repaint it
    const onResize = () => {
      resize();
      if (reduceMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [centerX, centerY, radius, gather, count]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block w-full h-full ${className}`} />;
}
