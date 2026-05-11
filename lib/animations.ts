export interface Animation {
  id: string;
  name: string;
  category:
    | "Buttons"
    | "Loaders"
    | "Text"
    | "Cards"
    | "Backgrounds"
    | "Micro-interactions";
  html: string;
  css: string;
  isNew?: boolean;
  previewHeight?: number;
}

export const animations: Animation[] = [
  // ── BUTTONS ────────────────────────────────────────────────────────────────
  {
    id: "neon-sign-btn",
    name: "Neon Sign",
    category: "Buttons",
    isNew: true,
    html: `<button class="neon-btn">EXECUTE</button>`,
    css: `.neon-btn {
  padding: 12px 36px;
  background: transparent;
  color: #a855f7;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2em;
  border: 2px solid #a855f7;
  border-radius: 4px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  text-transform: uppercase;
  animation: neonFlicker 3s ease-in-out infinite;
}
@keyframes neonFlicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    box-shadow:
      0 0 5px #a855f7,
      0 0 15px #a855f7,
      0 0 30px #a855f7,
      inset 0 0 10px rgba(168,85,247,0.1);
    text-shadow:
      0 0 5px #a855f7,
      0 0 15px #a855f7,
      0 0 25px #a855f7;
    border-color: #a855f7;
    color: #a855f7;
  }
  20%, 24%, 55% {
    box-shadow: none;
    text-shadow: none;
    border-color: rgba(168,85,247,0.3);
    color: rgba(168,85,247,0.4);
  }
}`,
  },
  {
    id: "liquid-fill-btn",
    name: "Liquid Fill",
    category: "Buttons",
    isNew: true,
    html: `<button class="liquid-btn"><span>Deploy</span></button>`,
    css: `.liquid-btn {
  position: relative;
  padding: 12px 36px;
  background: transparent;
  color: #f5f5f5;
  font-size: 15px;
  font-weight: 600;
  border: 2px solid #06b6d4;
  border-radius: 8px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  overflow: hidden;
  isolation: isolate;
}
.liquid-btn::before {
  content: '';
  position: absolute;
  bottom: -2px; left: -2px; right: -2px;
  height: 0%;
  background: linear-gradient(180deg, rgba(6,182,212,0.9), rgba(6,182,212,0.7));
  transition: none;
  animation: liquidRise 2.5s ease-in-out infinite;
  z-index: -1;
  border-radius: 0 0 6px 6px;
}
.liquid-btn span { position: relative; z-index: 1; }
@keyframes liquidRise {
  0%, 10%  { height: 0%; }
  45%, 55% { height: 103%; }
  90%, 100%{ height: 0%; }
}`,
  },
  {
    id: "holo-btn",
    name: "Holographic",
    category: "Buttons",
    isNew: true,
    html: `<button class="holo-btn">Holographic</button>`,
    css: `.holo-btn {
  position: relative;
  padding: 13px 36px;
  background: linear-gradient(135deg, #a855f7, #ec4899, #06b6d4, #a855f7);
  background-size: 300% 300%;
  color: white;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  animation: holoShift 3s linear infinite;
  overflow: hidden;
}
.holo-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg,
    transparent 20%,
    rgba(255,255,255,0.25) 35%,
    rgba(255,255,255,0.05) 50%,
    transparent 65%
  );
  background-size: 200% 100%;
  animation: holoShine 1.8s linear infinite;
  border-radius: 10px;
}
@keyframes holoShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes holoShine {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}`,
  },
  {
    id: "pulse-rings-btn",
    name: "Pulse Rings",
    category: "Buttons",
    isNew: true,
    html: `<button class="pulse-rings-btn">Connect</button>`,
    css: `.pulse-rings-btn {
  position: relative;
  padding: 12px 36px;
  background: #a855f7;
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
}
.pulse-rings-btn::before,
.pulse-rings-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  border: 2px solid #a855f7;
  animation: pulseRing 2s ease-out infinite;
}
.pulse-rings-btn::after {
  animation-delay: 0.7s;
}
@keyframes pulseRing {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}`,
  },
  {
    id: "rotating-border-btn",
    name: "Rotating Border",
    category: "Buttons",
    isNew: true,
    html: `<button class="rot-border-btn">Upgrade Now</button>`,
    css: `@property --rb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.rot-border-btn {
  position: relative;
  padding: 13px 36px;
  background: #0a0a0a;
  color: #f5f5f5;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  isolation: isolate;
}
.rot-border-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  background: conic-gradient(from var(--rb-angle), #a855f7, #ec4899, #3b82f6, #06b6d4, #a855f7);
  z-index: -1;
  animation: rbSpin 2.5s linear infinite;
}
.rot-border-btn::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: #0a0a0a;
  z-index: -1;
}
@keyframes rbSpin {
  to { --rb-angle: 360deg; }
}`,
  },

  // ── LOADERS ────────────────────────────────────────────────────────────────
  {
    id: "orbit-dots",
    name: "Orbit Dots",
    category: "Loaders",
    isNew: true,
    html: `<div class="orbit-loader">
  <div class="orbit-core"></div>
  <div class="orbit-ring orbit-ring-1"><div class="orbit-dot"></div></div>
  <div class="orbit-ring orbit-ring-2"><div class="orbit-dot"></div></div>
  <div class="orbit-ring orbit-ring-3"><div class="orbit-dot"></div></div>
</div>`,
    css: `.orbit-loader {
  position: relative;
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
}
.orbit-core {
  width: 14px; height: 14px;
  background: #a855f7;
  border-radius: 50%;
  box-shadow: 0 0 12px #a855f7, 0 0 24px rgba(168,85,247,0.5);
}
.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(168,85,247,0.2);
  animation: orbitSpin linear infinite;
}
.orbit-ring-1 { width: 34px; height: 34px; animation-duration: 1.2s; }
.orbit-ring-2 { width: 54px; height: 54px; animation-duration: 2s; animation-direction: reverse; }
.orbit-ring-3 { width: 74px; height: 74px; animation-duration: 3s; }
.orbit-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #a855f7;
  position: absolute;
  top: -3.5px; left: 50%; transform: translateX(-50%);
  box-shadow: 0 0 8px #a855f7;
}
.orbit-ring-2 .orbit-dot { background: #ec4899; box-shadow: 0 0 8px #ec4899; }
.orbit-ring-3 .orbit-dot { background: #06b6d4; box-shadow: 0 0 8px #06b6d4; }
@keyframes orbitSpin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "morphing-blob",
    name: "Morphing Blob",
    category: "Loaders",
    isNew: true,
    html: `<div class="blob-loader"></div>`,
    css: `.blob-loader {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  animation: blobMorph 3s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(168,85,247,0.5);
}
@keyframes blobMorph {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    transform: rotate(90deg);
  }
  50% {
    border-radius: 50% 60% 30% 60% / 40% 30% 60% 50%;
    transform: rotate(180deg);
  }
  75% {
    border-radius: 70% 30% 60% 40% / 30% 70% 40% 60%;
    transform: rotate(270deg);
  }
}`,
  },
  {
    id: "grid-dots-loader",
    name: "Grid Pulse",
    category: "Loaders",
    isNew: true,
    html: `<div class="grid-dots">
  <span></span><span></span><span></span>
  <span></span><span></span><span></span>
  <span></span><span></span><span></span>
</div>`,
    css: `.grid-dots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 52px;
}
.grid-dots span {
  width: 12px; height: 12px;
  background: #a855f7;
  border-radius: 3px;
  animation: gridPulse 1.4s ease-in-out infinite;
}
.grid-dots span:nth-child(1) { animation-delay: 0s; }
.grid-dots span:nth-child(2) { animation-delay: 0.1s; }
.grid-dots span:nth-child(3) { animation-delay: 0.2s; }
.grid-dots span:nth-child(4) { animation-delay: 0.3s; }
.grid-dots span:nth-child(5) { animation-delay: 0.4s; }
.grid-dots span:nth-child(6) { animation-delay: 0.5s; }
.grid-dots span:nth-child(7) { animation-delay: 0.6s; }
.grid-dots span:nth-child(8) { animation-delay: 0.7s; }
.grid-dots span:nth-child(9) { animation-delay: 0.8s; }
@keyframes gridPulse {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50%       { opacity: 1;    transform: scale(1); background: #ec4899; }
}`,
  },
  {
    id: "rainbow-comet",
    name: "Rainbow Comet",
    category: "Loaders",
    isNew: true,
    html: `<div class="comet-loader"></div>`,
    css: `.comet-loader {
  width: 64px; height: 64px;
  border-radius: 50%;
  position: relative;
  animation: cometSpin 1s linear infinite;
}
.comet-loader::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #a855f7,
    #ec4899,
    #06b6d4,
    #22c55e,
    #f59e0b,
    #a855f7
  );
  mask: radial-gradient(farthest-side, transparent 60%, black 61%);
  -webkit-mask: radial-gradient(farthest-side, transparent 60%, black 61%);
}
@keyframes cometSpin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "bounce-orbs",
    name: "Bounce Orbs",
    category: "Loaders",
    isNew: true,
    html: `<div class="bounce-orbs">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
</div>`,
    css: `.bounce-orbs {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  height: 60px;
}
.orb {
  width: 18px; height: 18px;
  border-radius: 50%;
  animation: orbBounce 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
}
.orb-1 {
  background: #a855f7;
  box-shadow: 0 0 16px rgba(168,85,247,0.8);
  animation-delay: 0s;
}
.orb-2 {
  background: #ec4899;
  box-shadow: 0 0 16px rgba(236,72,153,0.8);
  animation-delay: 0.2s;
}
.orb-3 {
  background: #06b6d4;
  box-shadow: 0 0 16px rgba(6,182,212,0.8);
  animation-delay: 0.4s;
}
@keyframes orbBounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-36px); }
}`,
  },

  // ── TEXT ───────────────────────────────────────────────────────────────────
  {
    id: "glitch-text",
    name: "RGB Glitch",
    category: "Text",
    isNew: true,
    html: `<div class="glitch-wrap"><span class="glitch" data-text="GLITCH">GLITCH</span></div>`,
    css: `.glitch-wrap {
  background: #0a0a0a;
  padding: 20px 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.glitch {
  font-size: 48px;
  font-weight: 900;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.08em;
  position: relative;
  animation: glitchMain 4s infinite;
}
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}
.glitch::before {
  color: #ff0066;
  animation: glitchR 4s infinite;
  clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
}
.glitch::after {
  color: #00ffff;
  animation: glitchB 4s infinite;
  clip-path: polygon(0 55%, 100% 55%, 100% 75%, 0 75%);
}
@keyframes glitchMain {
  0%, 90%, 100% { transform: none; }
  92%           { transform: skewX(1deg); }
  94%           { transform: skewX(-2deg); }
  96%           { transform: skewX(0.5deg); }
}
@keyframes glitchR {
  0%, 89%, 100% { transform: translate(0); opacity: 0; }
  90%           { transform: translate(-4px, 1px); opacity: 0.8; }
  93%           { transform: translate(3px, -1px); opacity: 0.8; }
  96%           { transform: translate(-2px, 0); opacity: 0.8; }
  99%           { transform: translate(0); opacity: 0; }
}
@keyframes glitchB {
  0%, 89%, 100% { transform: translate(0); opacity: 0; }
  91%           { transform: translate(4px, -1px); opacity: 0.8; }
  94%           { transform: translate(-3px, 1px); opacity: 0.8; }
  97%           { transform: translate(2px, 0); opacity: 0.8; }
  100%          { transform: translate(0); opacity: 0; }
}`,
  },
  {
    id: "typewriter-text",
    name: "Typewriter",
    category: "Text",
    isNew: true,
    html: `<div class="typewriter-wrap"><span class="typewriter-text">console.log('Hello World')</span></div>`,
    css: `.typewriter-wrap {
  display: flex;
  align-items: center;
  background: #0a0a0a;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #222;
}
.typewriter-text {
  font-size: 16px;
  font-family: 'Courier New', monospace;
  color: #22c55e;
  white-space: nowrap;
  overflow: hidden;
  border-right: 2px solid #22c55e;
  width: 0;
  animation:
    typeReveal 3s steps(28) infinite alternate,
    cursorBlink 0.7s step-end infinite;
}
@keyframes typeReveal {
  from { width: 0; }
  to   { width: 27ch; }
}
@keyframes cursorBlink {
  0%, 100% { border-color: #22c55e; }
  50%       { border-color: transparent; }
}`,
  },
  {
    id: "letter-wave-text",
    name: "Letter Wave",
    category: "Text",
    isNew: true,
    html: `<div class="wave-letters">
  <span style="--i:0">W</span><span style="--i:1">A</span><span style="--i:2">V</span><span style="--i:3">E</span><span style="--i:4"> </span><span style="--i:5">T</span><span style="--i:6">E</span><span style="--i:7">X</span><span style="--i:8">T</span>
</div>`,
    css: `.wave-letters {
  display: flex;
  font-size: 40px;
  font-weight: 900;
  font-family: system-ui, sans-serif;
  perspective: 400px;
}
.wave-letters span {
  display: inline-block;
  color: #f5f5f5;
  animation: letterWave 2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}
@keyframes letterWave {
  0%, 100% {
    transform: translateY(0) rotateX(0deg);
    color: #f5f5f5;
  }
  30% {
    transform: translateY(-18px) rotateX(20deg);
    color: #a855f7;
  }
  60% {
    transform: translateY(6px) rotateX(-10deg);
    color: #ec4899;
  }
}`,
  },
  {
    id: "gradient-sweep-text",
    name: "Gradient Sweep",
    category: "Text",
    isNew: true,
    html: `<h2 class="sweep-text">Full Stack Dev</h2>`,
    css: `.sweep-text {
  font-size: 38px;
  font-weight: 900;
  font-family: system-ui, sans-serif;
  margin: 0;
  background: linear-gradient(
    90deg,
    #888 0%,
    #888 25%,
    #a855f7 35%,
    #ec4899 50%,
    #06b6d4 65%,
    #888 75%,
    #888 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: sweepGrad 3s linear infinite;
}
@keyframes sweepGrad {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}`,
  },
  {
    id: "neon-flicker-text",
    name: "Neon Flicker",
    category: "Text",
    isNew: true,
    html: `<h2 class="neon-flicker-txt">NEON LIGHTS</h2>`,
    css: `.neon-flicker-txt {
  font-size: 36px;
  font-weight: 900;
  font-family: system-ui, sans-serif;
  margin: 0;
  color: #fff;
  letter-spacing: 0.12em;
  animation: neonTxtFlicker 5s linear infinite;
}
@keyframes neonTxtFlicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    text-shadow:
      0 0 4px #fff,
      0 0 11px #fff,
      0 0 19px #fff,
      0 0 40px #a855f7,
      0 0 80px #a855f7,
      0 0 90px #a855f7,
      0 0 100px #a855f7,
      0 0 150px #a855f7;
  }
  20%, 24%, 55% {
    text-shadow: none;
    color: rgba(255,255,255,0.3);
  }
}`,
  },

  // ── CARDS ──────────────────────────────────────────────────────────────────
  {
    id: "holo-foil-card",
    name: "Holographic Foil",
    category: "Cards",
    isNew: true,
    previewHeight: 200,
    html: `<div class="foil-card">
  <div class="foil-shine"></div>
  <div class="foil-content">
    <div class="foil-badge">PRO</div>
    <h3>Ultra Plan</h3>
    <p>Unlimited everything</p>
  </div>
</div>`,
    css: `.foil-card {
  width: 220px;
  padding: 28px 24px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a0a2e, #0d1a2e);
  border: 1px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px rgba(168,85,247,0.3);
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  animation: foilFloat 4s ease-in-out infinite;
}
.foil-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 25%,
    rgba(168,85,247,0.15) 35%,
    rgba(236,72,153,0.15) 45%,
    rgba(6,182,212,0.15) 55%,
    transparent 65%
  );
  background-size: 300% 100%;
  animation: foilSweep 2.5s linear infinite;
  mix-blend-mode: screen;
}
.foil-content { position: relative; z-index: 1; }
.foil-badge {
  display: inline-block;
  padding: 3px 10px;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  border-radius: 99px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}
.foil-card h3 { font-size: 20px; font-weight: 700; margin: 0 0 6px; }
.foil-card p  { font-size: 13px; color: #888; margin: 0; }
@keyframes foilSweep {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
@keyframes foilFloat {
  0%, 100% { transform: translateY(0) rotateX(0deg); }
  50%       { transform: translateY(-6px) rotateX(3deg); }
}`,
  },
  {
    id: "aurora-card",
    name: "Aurora Glass",
    category: "Cards",
    isNew: true,
    previewHeight: 210,
    html: `<div class="aurora-card">
  <div class="aurora-blob ab1"></div>
  <div class="aurora-blob ab2"></div>
  <div class="aurora-inner">
    <h3>Aurora Card</h3>
    <p>Next-gen glassmorphism</p>
  </div>
</div>`,
    css: `.aurora-card {
  width: 220px;
  padding: 28px 24px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  background: rgba(10,10,10,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
}
.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  animation: auroraMove 4s ease-in-out infinite alternate;
}
.ab1 {
  width: 140px; height: 140px;
  background: rgba(168,85,247,0.4);
  top: -50px; left: -40px;
}
.ab2 {
  width: 100px; height: 100px;
  background: rgba(6,182,212,0.35);
  bottom: -30px; right: -20px;
  animation-delay: -2s;
  animation-direction: alternate-reverse;
}
.aurora-inner { position: relative; z-index: 1; }
.aurora-card h3 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
.aurora-card p  { font-size: 13px; color: rgba(245,245,245,0.6); margin: 0; }
@keyframes auroraMove {
  from { transform: translate(0, 0) scale(1); opacity: 0.6; }
  to   { transform: translate(20px, 15px) scale(1.2); opacity: 1; }
}`,
  },
  {
    id: "scan-line-card",
    name: "Scan Line",
    category: "Cards",
    isNew: true,
    previewHeight: 200,
    html: `<div class="scan-card">
  <div class="scan-line"></div>
  <div class="scan-header">SYSTEM STATUS</div>
  <div class="scan-row"><span class="scan-dot ok"></span><span>Core services</span><span class="scan-val ok">ONLINE</span></div>
  <div class="scan-row"><span class="scan-dot ok"></span><span>Database</span><span class="scan-val ok">ONLINE</span></div>
  <div class="scan-row"><span class="scan-dot warn"></span><span>Cache layer</span><span class="scan-val warn">DEGRADED</span></div>
</div>`,
    css: `.scan-card {
  width: 240px;
  padding: 20px;
  background: #050a05;
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(34,197,94,0.1), inset 0 0 20px rgba(34,197,94,0.03);
}
.scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent);
  animation: scanMove 2.5s linear infinite;
  box-shadow: 0 0 12px rgba(34,197,94,0.8);
}
.scan-header {
  font-size: 10px;
  color: #22c55e;
  letter-spacing: 0.2em;
  margin-bottom: 14px;
  opacity: 0.7;
}
.scan-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(34,197,94,0.7);
  margin-bottom: 8px;
}
.scan-row span:nth-child(2) { flex: 1; }
.scan-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: dotBlink 1.5s ease-in-out infinite;
}
.scan-dot.ok   { background: #22c55e; }
.scan-dot.warn { background: #f59e0b; animation-delay: 0.3s; }
.scan-val { font-size: 10px; letter-spacing: 0.1em; }
.scan-val.ok   { color: #22c55e; }
.scan-val.warn { color: #f59e0b; }
@keyframes scanMove {
  from { top: 0%; }
  to   { top: 100%; }
}
@keyframes dotBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}`,
  },
  {
    id: "depth-float-card",
    name: "3D Depth Float",
    category: "Cards",
    isNew: true,
    previewHeight: 200,
    html: `<div class="depth-card">
  <div class="depth-layer dl3"></div>
  <div class="depth-layer dl2"></div>
  <div class="depth-main">
    <span class="depth-icon">⚡</span>
    <h3>Performance</h3>
    <p>100ms response</p>
  </div>
</div>`,
    css: `.depth-card {
  position: relative;
  width: 180px;
  animation: depthFloat 3.5s ease-in-out infinite;
}
.depth-main {
  position: relative;
  z-index: 3;
  padding: 24px 20px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 14px;
  font-family: system-ui, sans-serif;
  color: #f5f5f5;
  text-align: center;
}
.depth-layer {
  position: absolute;
  border-radius: 14px;
  left: 0; right: 0;
}
.dl2 {
  top: 8px; bottom: -8px;
  background: #141414;
  border: 1px solid #2a2a2a;
  z-index: 2;
  left: 6px; right: 6px;
}
.dl3 {
  top: 16px; bottom: -16px;
  background: #0f0f0f;
  border: 1px solid #222;
  z-index: 1;
  left: 12px; right: 12px;
}
.depth-icon { font-size: 28px; display: block; margin-bottom: 10px; }
.depth-main h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
.depth-main p  { font-size: 12px; color: #666; margin: 0; }
@keyframes depthFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}`,
  },
  {
    id: "terminal-card",
    name: "Terminal Card",
    category: "Cards",
    isNew: true,
    previewHeight: 210,
    html: `<div class="term-card">
  <div class="term-bar">
    <span class="tb tb-r"></span><span class="tb tb-y"></span><span class="tb tb-g"></span>
    <span class="term-title">bash</span>
  </div>
  <div class="term-body">
    <p class="term-line"><span class="term-ps">$</span> npm run build</p>
    <p class="term-line term-out">✓ Compiled successfully</p>
    <p class="term-line term-out">✓ Linting passed</p>
    <p class="term-line"><span class="term-ps">$</span><span class="term-cursor">▌</span></p>
  </div>
</div>`,
    css: `.term-card {
  width: 260px;
  background: #0d0d0d;
  border: 1px solid #222;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.term-bar {
  background: #1a1a1a;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #222;
}
.tb {
  width: 10px; height: 10px;
  border-radius: 50%;
}
.tb-r { background: #ff5f57; }
.tb-y { background: #febc2e; }
.tb-g { background: #28c840; }
.term-title {
  font-size: 11px;
  color: #555;
  margin-left: auto;
  margin-right: auto;
}
.term-body { padding: 14px 16px; }
.term-line {
  font-size: 12px;
  color: #888;
  margin: 0 0 8px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.term-ps { color: #a855f7; }
.term-out { color: #22c55e; padding-left: 14px; }
.term-cursor {
  color: #f5f5f5;
  animation: cursorPulse 1s step-end infinite;
}
@keyframes cursorPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}`,
  },

  // ── BACKGROUNDS ────────────────────────────────────────────────────────────
  {
    id: "aurora-bg",
    name: "Aurora Borealis",
    category: "Backgrounds",
    isNew: true,
    previewHeight: 170,
    html: `<div class="aurora-bg">
  <div class="aurora-wave aw1"></div>
  <div class="aurora-wave aw2"></div>
  <div class="aurora-wave aw3"></div>
  <span class="aurora-label">Aurora</span>
</div>`,
    css: `.aurora-bg {
  width: 100%; height: 150px;
  background: #020408;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.aurora-wave {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  mix-blend-mode: screen;
  animation: auroraWave ease-in-out infinite alternate;
}
.aw1 {
  width: 280px; height: 200px;
  background: rgba(168,85,247,0.5);
  top: -80px; left: -60px;
  animation-duration: 6s;
}
.aw2 {
  width: 240px; height: 180px;
  background: rgba(6,182,212,0.4);
  top: -60px; right: -40px;
  animation-duration: 8s;
  animation-delay: -3s;
}
.aw3 {
  width: 200px; height: 160px;
  background: rgba(34,197,94,0.3);
  bottom: -60px; left: 30%;
  animation-duration: 7s;
  animation-delay: -5s;
}
.aurora-label {
  position: relative;
  z-index: 1;
  font-size: 28px;
  font-weight: 900;
  color: rgba(255,255,255,0.9);
  font-family: system-ui, sans-serif;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(168,85,247,0.8);
}
@keyframes auroraWave {
  from { transform: translate(0, 0) scale(1); opacity: 0.5; }
  to   { transform: translate(30px, 20px) scale(1.3); opacity: 1; }
}`,
  },
  {
    id: "animated-grid-bg",
    name: "Grid Lines",
    category: "Backgrounds",
    isNew: true,
    previewHeight: 170,
    html: `<div class="grid-bg">
  <div class="grid-lines"></div>
  <div class="grid-glow"></div>
  <span class="grid-label">SYSTEM</span>
</div>`,
    css: `.grid-bg {
  width: 100%; height: 150px;
  background: #020408;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: gridScroll 8s linear infinite;
}
.grid-glow {
  position: absolute;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%);
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: gridGlowPulse 3s ease-in-out infinite;
}
.grid-label {
  position: relative;
  z-index: 1;
  font-size: 22px;
  font-weight: 900;
  color: #a855f7;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.3em;
  text-shadow: 0 0 20px rgba(168,85,247,0.8);
}
@keyframes gridScroll {
  from { transform: translate(0, 0); }
  to   { transform: translate(30px, 30px); }
}
@keyframes gridGlowPulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.4); }
}`,
  },
  {
    id: "blob-field-bg",
    name: "Blob Field",
    category: "Backgrounds",
    isNew: true,
    previewHeight: 170,
    html: `<div class="blob-bg">
  <div class="blob-shape bs1"></div>
  <div class="blob-shape bs2"></div>
  <div class="blob-shape bs3"></div>
  <span class="blob-label">Creative</span>
</div>`,
    css: `.blob-bg {
  width: 100%; height: 150px;
  background: #0a0a0a;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.blob-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(35px);
  animation: blobDrift ease-in-out infinite alternate;
}
.bs1 {
  width: 160px; height: 160px;
  background: rgba(168,85,247,0.45);
  top: -40px; left: -20px;
  animation-duration: 5s;
}
.bs2 {
  width: 120px; height: 120px;
  background: rgba(236,72,153,0.4);
  bottom: -30px; right: 10px;
  animation-duration: 7s;
  animation-delay: -3s;
}
.bs3 {
  width: 100px; height: 100px;
  background: rgba(6,182,212,0.35);
  top: 20px; right: 40%;
  animation-duration: 6s;
  animation-delay: -1.5s;
}
.blob-label {
  position: relative;
  z-index: 1;
  font-size: 28px;
  font-weight: 900;
  color: rgba(255,255,255,0.95);
  font-family: system-ui, sans-serif;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
}
@keyframes blobDrift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(25px, 18px) scale(1.15); }
}`,
  },
  {
    id: "particle-bg",
    name: "Particle Stars",
    category: "Backgrounds",
    isNew: true,
    previewHeight: 170,
    html: `<div class="particle-bg">
  <div class="star s1"></div><div class="star s2"></div><div class="star s3"></div>
  <div class="star s4"></div><div class="star s5"></div><div class="star s6"></div>
  <div class="star s7"></div><div class="star s8"></div><div class="star s9"></div>
  <span class="particle-label">Cosmos</span>
</div>`,
    css: `.particle-bg {
  width: 100%; height: 150px;
  background: radial-gradient(ellipse at center, #0d0520 0%, #020408 100%);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: starTwinkle ease-in-out infinite alternate;
}
.s1 { width:2px;height:2px; top:15%;left:10%; animation-duration:2.1s; }
.s2 { width:3px;height:3px; top:25%;left:80%; animation-duration:3.5s; animation-delay:-1s; }
.s3 { width:2px;height:2px; top:65%;left:20%; animation-duration:2.8s; animation-delay:-0.5s; }
.s4 { width:4px;height:4px; top:40%;left:55%; animation-duration:4.2s; animation-delay:-2s; background: #a855f7; box-shadow: 0 0 6px #a855f7; }
.s5 { width:2px;height:2px; top:70%;left:70%; animation-duration:2.4s; animation-delay:-0.8s; }
.s6 { width:3px;height:3px; top:10%;left:40%; animation-duration:3.1s; animation-delay:-1.5s; background: #06b6d4; box-shadow: 0 0 6px #06b6d4; }
.s7 { width:2px;height:2px; top:80%;left:45%; animation-duration:2.7s; animation-delay:-0.3s; }
.s8 { width:3px;height:3px; top:50%;left:15%; animation-duration:3.8s; animation-delay:-2.5s; background: #ec4899; box-shadow: 0 0 6px #ec4899; }
.s9 { width:2px;height:2px; top:30%;left:65%; animation-duration:2.2s; animation-delay:-0.7s; }
.particle-label {
  position: relative;
  z-index: 1;
  font-size: 28px;
  font-weight: 900;
  color: rgba(255,255,255,0.9);
  font-family: system-ui, sans-serif;
  letter-spacing: 0.12em;
  text-shadow: 0 0 30px rgba(168,85,247,0.6);
}
@keyframes starTwinkle {
  from { opacity: 0.1; transform: scale(0.8); }
  to   { opacity: 1;   transform: scale(1.3); }
}`,
  },

  // ── MICRO-INTERACTIONS ────────────────────────────────────────────────────
  {
    id: "skeleton-shimmer",
    name: "Skeleton Shimmer",
    category: "Micro-interactions",
    isNew: true,
    previewHeight: 175,
    html: `<div class="skeleton-card">
  <div class="skel-avatar"></div>
  <div class="skel-lines">
    <div class="skel-line sl-title"></div>
    <div class="skel-line sl-sub"></div>
    <div class="skel-line sl-short"></div>
  </div>
</div>`,
    css: `.skeleton-card {
  display: flex;
  gap: 14px;
  padding: 20px;
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  width: 260px;
}
.skel-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #1e1e1e;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}
.skel-avatar::after,
.skel-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.07) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmerSlide 1.5s linear infinite;
}
.skel-lines { flex: 1; display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.skel-line {
  height: 12px;
  background: #1e1e1e;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.sl-title  { width: 100%; }
.sl-sub    { width: 75%; }
.sl-short  { width: 50%; }
.skel-line::after { animation-delay: 0.1s; }
@keyframes shimmerSlide {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}`,
  },
  {
    id: "signal-pulse",
    name: "Signal Pulse",
    category: "Micro-interactions",
    isNew: true,
    html: `<div class="signal-wrap">
  <div class="signal-icon">
    <div class="sig-ring sr1"></div>
    <div class="sig-ring sr2"></div>
    <div class="sig-ring sr3"></div>
    <div class="sig-core"></div>
  </div>
  <span class="signal-label">Broadcasting</span>
</div>`,
    css: `.signal-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.signal-icon {
  position: relative;
  width: 60px; height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sig-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid #a855f7;
  animation: sigExpand 2.4s ease-out infinite;
}
.sr1 { width: 20px; height: 20px; animation-delay: 0s; }
.sr2 { width: 20px; height: 20px; animation-delay: 0.8s; }
.sr3 { width: 20px; height: 20px; animation-delay: 1.6s; }
.sig-core {
  width: 12px; height: 12px;
  background: #a855f7;
  border-radius: 50%;
  box-shadow: 0 0 10px #a855f7;
  z-index: 1;
}
.signal-label {
  font-size: 13px;
  color: #888;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.05em;
}
@keyframes sigExpand {
  0%   { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(4); opacity: 0; }
}`,
  },
  {
    id: "toggle-switch",
    name: "Toggle Switch",
    category: "Micro-interactions",
    isNew: true,
    html: `<div class="toggle-demo">
  <div class="toggle-row">
    <span class="toggle-lbl">Dark Mode</span>
    <div class="toggle-track on"><div class="toggle-thumb"></div></div>
  </div>
  <div class="toggle-row">
    <span class="toggle-lbl">Notifications</span>
    <div class="toggle-track off"><div class="toggle-thumb"></div></div>
  </div>
  <div class="toggle-row">
    <span class="toggle-lbl">Auto-sync</span>
    <div class="toggle-track anim"><div class="toggle-thumb"></div></div>
  </div>
</div>`,
    css: `.toggle-demo {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: system-ui, sans-serif;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.toggle-lbl {
  font-size: 13px;
  color: #888;
  width: 110px;
}
.toggle-track {
  width: 44px; height: 24px;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-track.on  { background: #a855f7; }
.toggle-track.off { background: #333; }
.toggle-track.anim {
  background: #333;
  animation: toggleAuto 3s ease-in-out infinite;
}
.toggle-thumb {
  position: absolute;
  width: 18px; height: 18px;
  background: white;
  border-radius: 50%;
  top: 3px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
  transition: left 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.on  .toggle-thumb { left: 23px; }
.off .toggle-thumb { left: 3px; }
.anim .toggle-thumb { animation: thumbAuto 3s ease-in-out infinite; left: 3px; }
@keyframes toggleAuto {
  0%, 40%  { background: #333; }
  50%, 90% { background: #a855f7; }
  100%     { background: #333; }
}
@keyframes thumbAuto {
  0%, 40%  { left: 3px; }
  50%, 90% { left: 23px; }
  100%     { left: 3px; }
}`,
  },
  {
    id: "bell-notification",
    name: "Bell Notification",
    category: "Micro-interactions",
    isNew: true,
    html: `<div class="bell-wrap">
  <div class="bell-container">
    <span class="bell-icon">🔔</span>
    <span class="bell-badge">3</span>
  </div>
  <span class="bell-text">New alerts</span>
</div>`,
    css: `.bell-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.bell-container {
  position: relative;
  width: 52px; height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-icon {
  font-size: 32px;
  display: block;
  animation: bellShake 4s ease-in-out infinite;
  transform-origin: top center;
}
.bell-badge {
  position: absolute;
  top: 2px; right: 2px;
  width: 18px; height: 18px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  animation: badgePop 4s ease-in-out infinite;
}
.bell-text {
  font-size: 13px;
  color: #888;
  font-family: system-ui, sans-serif;
}
@keyframes bellShake {
  0%, 60%, 100% { transform: rotate(0deg); }
  65%  { transform: rotate(15deg); }
  70%  { transform: rotate(-12deg); }
  75%  { transform: rotate(10deg); }
  80%  { transform: rotate(-8deg); }
  85%  { transform: rotate(5deg); }
  90%  { transform: rotate(-3deg); }
}
@keyframes badgePop {
  0%, 55%  { transform: scale(1); }
  60%      { transform: scale(1.4); }
  65%      { transform: scale(0.9); }
  70%      { transform: scale(1.1); }
  75%, 100%{ transform: scale(1); }
}`,
  },
];

export const animationCategories = [
  "All",
  "Buttons",
  "Loaders",
  "Text",
  "Cards",
  "Backgrounds",
  "Micro-interactions",
] as const;

export type AnimationCategory = (typeof animationCategories)[number];
