const fs = require('fs');

const content = `export interface Animation {
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
    id: "glass-btn",
    name: "Glassmorphism Button",
    category: "Buttons",
    html: \`<button class="glass-btn">Get Started</button>\`,
    css: \`.glass-btn {
  padding: 12px 32px;
  background: rgba(168, 85, 247, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #f5f5f5;
  font-size: 16px;
  border-radius: 12px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.02em;
  animation: glassPulse 3s ease-in-out infinite;
}
@keyframes glassPulse {
  0%, 100% {
    background: rgba(168, 85, 247, 0.15);
    box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
  }
  50% {
    background: rgba(168, 85, 247, 0.28);
    box-shadow: 0 8px 40px rgba(168, 85, 247, 0.38);
  }
}\`,
  },
  {
    id: "grad-border-btn",
    name: "Rotating Gradient Border",
    category: "Buttons",
    isNew: true,
    html: \`<button class="grad-border-btn">Upgrade Now</button>\`,
    css: \`@property --gb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.grad-border-btn {
  position: relative;
  padding: 12px 32px;
  background: #0a0a0a;
  color: #f5f5f5;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  isolation: isolate;
}
.grad-border-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  background: conic-gradient(from var(--gb-angle), #a855f7, #ec4899, #3b82f6, #06b6d4, #a855f7);
  z-index: -1;
  animation: gbSpin 3s linear infinite;
}
.grad-border-btn::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: #0a0a0a;
  z-index: -1;
}
@keyframes gbSpin {
  to { --gb-angle: 360deg; }
}\`,
  },
  {
    id: "elastic-btn",
    name: "Elastic Bounce Button",
    category: "Buttons",
    html: \`<button class="elastic-btn">Click!</button>\`,
    css: \`.elastic-btn {
  padding: 12px 32px;
  background: #a855f7;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: system-ui, sans-serif;
  animation: elasticPop 2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
}
@keyframes elasticPop {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.18, 0.82); }
  30% { transform: scale(0.88, 1.12); }
  45% { transform: scale(1.06, 0.94); }
  60% { transform: scale(0.97, 1.03); }
  75% { transform: scale(1.01, 0.99); }
}\`,
  },

  // ── LOADERS ────────────────────────────────────────────────────────────────
  {
    id: "conic-spinner",
    name: "Conic Gradient Spinner",
    category: "Loaders",
    html: \`<div class="conic-spinner"></div>\`,
    css: \`.conic-spinner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: conic-gradient(#a855f7 0%, transparent 65%);
  animation: conicSpin 0.75s linear infinite;
  mask: radial-gradient(farthest-side, transparent 58%, black 59%);
  -webkit-mask: radial-gradient(farthest-side, transparent 58%, black 59%);
}
@keyframes conicSpin {
  to { transform: rotate(360deg); }
}\`,
  },
  {
    id: "progress-ring",
    name: "SVG Progress Ring",
    category: "Loaders",
    previewHeight: 160,
    html: \`<div class="ring-wrap">
  <svg class="prog-ring" viewBox="0 0 100 100">
    <circle class="ring-bg" cx="50" cy="50" r="38"/>
    <circle class="ring-fill" cx="50" cy="50" r="38"/>
  </svg>
  <span class="ring-label">75%</span>
</div>\`,
    css: \`.ring-wrap {
  position: relative;
  width: 90px;
  height: 90px;
}
.prog-ring {
  width: 90px;
  height: 90px;
  transform: rotate(-90deg);
}
.ring-bg {
  fill: none;
  stroke: #1a1a1a;
  stroke-width: 8;
}
.ring-fill {
  fill: none;
  stroke: #a855f7;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 238.76;
  stroke-dashoffset: 238.76;
  animation: ringAnim 2s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 6px #a855f7);
}
.ring-label {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 15px;
  font-weight: 700;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
}
@keyframes ringAnim {
  from { stroke-dashoffset: 238.76; }
  to   { stroke-dashoffset: 59.69; }
}\`,
  },
  {
    id: "wave-bars",
    name: "Wave Bar Loader",
    category: "Loaders",
    html: \`<div class="wave-bars">
  <span></span><span></span><span></span><span></span><span></span>
</div>\`,
    css: \`.wave-bars {
  display: flex;
  gap: 5px;
  align-items: center;
  height: 52px;
}
.wave-bars span {
  width: 7px;
  background: #a855f7;
  border-radius: 4px;
  animation: waveBars 1.2s ease-in-out infinite;
}
.wave-bars span:nth-child(1) { animation-delay: 0s; }
.wave-bars span:nth-child(2) { animation-delay: 0.15s; }
.wave-bars span:nth-child(3) { animation-delay: 0.3s; }
.wave-bars span:nth-child(4) { animation-delay: 0.45s; }
.wave-bars span:nth-child(5) { animation-delay: 0.6s; }
@keyframes waveBars {
  0%, 100% { height: 10px; opacity: 0.35; }
  50%       { height: 44px; opacity: 1; }
}\`,
  },

  // ── TEXT ───────────────────────────────────────────────────────────────────
  {
    id: "clip-reveal",
    name: "Clip Path Text Reveal",
    category: "Text",
    html: \`<div class="reveal-wrap"><h2 class="reveal-text">Modern CSS</h2></div>\`,
    css: \`.reveal-wrap {
  overflow: hidden;
}
.reveal-text {
  font-size: 38px;
  font-weight: 900;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  margin: 0;
  clip-path: inset(0 100% 0 0);
  animation: clipReveal 1.8s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate;
}
@keyframes clipReveal {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}\`,
  },
  {
    id: "hue-shift-text",
    name: "Hue Shift Gradient Text",
    category: "Text",
    html: \`<h2 class="hue-text">Colorshift</h2>\`,
    css: \`.hue-text {
  font-size: 44px;
  font-weight: 900;
  font-family: system-ui, sans-serif;
  margin: 0;
  background: linear-gradient(90deg, #a855f7, #ec4899, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: hueShift 4s linear infinite;
}
@keyframes hueShift {
  to { filter: hue-rotate(360deg); }
}\`,
  },
  {
    id: "word-stagger",
    name: "Stagger Word Pop",
    category: "Text",
    html: \`<p class="stagger-words">
  <span>Build.</span><span>Ship.</span><span>Repeat.</span>
</p>\`,
    css: \`.stagger-words {
  font-size: 28px;
  font-weight: 900;
  font-family: system-ui, sans-serif;
  display: flex;
  gap: 12px;
  margin: 0;
}
.stagger-words span {
  display: inline-block;
  animation: wordPop 2.4s ease-in-out infinite;
}
.stagger-words span:nth-child(1) { animation-delay: 0s;   color: #a855f7; }
.stagger-words span:nth-child(2) { animation-delay: 0.3s; color: #ec4899; }
.stagger-words span:nth-child(3) { animation-delay: 0.6s; color: #3b82f6; }
@keyframes wordPop {
  0%, 10%   { opacity: 0; transform: translateY(18px) scale(0.85); }
  25%, 75%  { opacity: 1; transform: translateY(0) scale(1); }
  90%, 100% { opacity: 0; transform: translateY(-12px) scale(0.9); }
}\`,
  },

  // ── CARDS ──────────────────────────────────────────────────────────────────
  {
    id: "bento-card",
    name: "Bento Border Card",
    category: "Cards",
    isNew: true,
    previewHeight: 180,
    html: \`<div class="bento-card">
  <div class="bento-icon">⚡</div>
  <h3>Fast</h3>
  <p>Lightning performance</p>
</div>\`,
    css: \`@property --bc-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.bento-card {
  width: 200px;
  padding: 24px;
  border-radius: 16px;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  position: relative;
  isolation: isolate;
}
.bento-card::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: 17.5px;
  background: conic-gradient(from var(--bc-angle), #a855f7 0%, transparent 35%, transparent 65%, #a855f7 100%);
  z-index: -1;
  animation: bcSpin 4s linear infinite;
}
.bento-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: #111111;
  z-index: -1;
}
.bento-icon { font-size: 28px; margin-bottom: 12px; }
.bento-card h3 { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
.bento-card p  { font-size: 13px; color: #888; margin: 0; }
@keyframes bcSpin {
  to { --bc-angle: 360deg; }
}\`,
  },
  {
    id: "glass-card",
    name: "Glassmorphism Card",
    category: "Cards",
    isNew: true,
    previewHeight: 200,
    html: \`<div class="glass-card">
  <div class="gc-glow"></div>
  <h3>Glass Card</h3>
  <p>Frosted glass effect</p>
  <span class="gc-tag">Modern</span>
</div>\`,
    css: \`.glass-card {
  width: 220px;
  padding: 28px 24px;
  background: rgba(168, 85, 247, 0.07);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 20px;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  position: relative;
  overflow: hidden;
  animation: gcFloat 4s ease-in-out infinite;
}
.gc-glow {
  position: absolute;
  width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%);
  border-radius: 50%;
  top: -60px; right: -60px;
  animation: gcGlow 4s ease-in-out infinite alternate;
}
.glass-card h3 {
  font-size: 18px; font-weight: 700;
  margin: 0 0 8px; position: relative; z-index: 1;
}
.glass-card p {
  font-size: 13px; color: rgba(245,245,245,0.55);
  margin: 0 0 16px; position: relative; z-index: 1;
}
.gc-tag {
  font-size: 11px; font-weight: 600;
  background: rgba(168,85,247,0.2);
  border: 1px solid rgba(168,85,247,0.35);
  color: #c084fc;
  padding: 3px 10px; border-radius: 99px;
  position: relative; z-index: 1;
  display: inline-block;
}
@keyframes gcFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-7px); }
}
@keyframes gcGlow {
  from { opacity: 0.4; transform: translate(0, 0); }
  to   { opacity: 0.8; transform: translate(-15px, 15px); }
}\`,
  },
  {
    id: "tilt-card",
    name: "3D Tilt Float Card",
    category: "Cards",
    previewHeight: 160,
    html: \`<div class="tilt-card">
  <span class="tc-icon">🚀</span>
  <p>Launch Ready</p>
</div>\`,
    css: \`.tilt-card {
  width: 160px; height: 110px;
  background: linear-gradient(135deg, #1a0a2e, #111);
  border: 1px solid rgba(168,85,247,0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #f5f5f5;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  animation: tiltFloat 3.5s ease-in-out infinite;
}
.tc-icon { font-size: 28px; }
@keyframes tiltFloat {
  0%, 100% {
    transform: rotateX(0deg) rotateY(0deg) translateY(0);
    box-shadow: 0 10px 40px rgba(168,85,247,0.1);
  }
  33% {
    transform: rotateX(6deg) rotateY(-6deg) translateY(-6px);
    box-shadow: 0 20px 60px rgba(168,85,247,0.25);
  }
  66% {
    transform: rotateX(-5deg) rotateY(6deg) translateY(-6px);
    box-shadow: 0 20px 60px rgba(168,85,247,0.25);
  }
}\`,
  },

  // ── BACKGROUNDS ────────────────────────────────────────────────────────────
  {
    id: "mesh-gradient",
    name: "CSS Mesh Gradient",
    category: "Backgrounds",
    isNew: true,
    previewHeight: 160,
    html: \`<div class="mesh-bg"><span>Mesh</span></div>\`,
    css: \`.mesh-bg {
  width: 100%; height: 140px;
  background:
    radial-gradient(ellipse at 0% 0%,   hsl(280, 90%, 35%) 0%, transparent 55%),
    radial-gradient(ellipse at 100% 0%,  hsl(200, 90%, 35%) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 100%, hsl(330, 80%, 35%) 0%, transparent 55%),
    #050508;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  animation: meshHue 8s ease-in-out infinite alternate;
}
.mesh-bg::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 100% 100%, hsl(260, 80%, 30%) 0%, transparent 50%),
    radial-gradient(ellipse at 0% 100%,   hsl(180, 80%, 30%) 0%, transparent 50%);
  animation: meshHue2 8s ease-in-out infinite alternate;
  opacity: 0.7;
}
.mesh-bg span {
  font-size: 30px; font-weight: 900;
  color: rgba(255,255,255,0.92);
  position: relative; z-index: 1;
  font-family: system-ui, sans-serif;
  text-shadow: 0 0 30px rgba(255,255,255,0.2);
}
@keyframes meshHue {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(50deg); }
}
@keyframes meshHue2 {
  from { filter: hue-rotate(50deg); opacity: 0.5; }
  to   { filter: hue-rotate(0deg);  opacity: 0.9; }
}\`,
  },
  {
    id: "grain-overlay",
    name: "Animated Film Grain",
    category: "Backgrounds",
    previewHeight: 160,
    html: \`<div class="grain-bg"><span>Grain</span></div>\`,
    css: \`.grain-bg {
  width: 100%; height: 140px;
  background: linear-gradient(135deg, #1a0533 0%, #0a0f1a 50%, #001a12 100%);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.grain-bg::before {
  content: '';
  position: absolute;
  inset: -60%;
  width: 220%; height: 220%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 160px 160px;
  opacity: 0.07;
  animation: grain 0.5s steps(3) infinite;
  mix-blend-mode: screen;
}
.grain-bg span {
  font-size: 30px; font-weight: 900;
  color: rgba(255,255,255,0.9);
  position: relative; z-index: 1;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.05em;
}
@keyframes grain {
  0%   { transform: translate(0,   0);  }
  20%  { transform: translate(-3%, 5%); }
  40%  { transform: translate(5%, -3%); }
  60%  { transform: translate(-4%, 4%); }
  80%  { transform: translate(3%, -5%); }
  100% { transform: translate(-2%, 3%); }
}\`,
  },

  // ── MICRO-INTERACTIONS ────────────────────────────────────────────────────
  {
    id: "toast-timer",
    name: "Toast with Timer Bar",
    category: "Micro-interactions",
    isNew: true,
    previewHeight: 120,
    html: \`<div class="timed-toast">
  <div class="tt-content">
    <span class="tt-icon">&#10003;</span>
    <span class="tt-msg">Changes saved successfully</span>
  </div>
  <div class="tt-bar"></div>
</div>\`,
    css: \`.timed-toast {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  width: 280px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  animation: ttSlide 3.5s ease-in-out infinite;
}
.tt-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  font-family: system-ui, sans-serif;
}
.tt-icon {
  width: 22px; height: 22px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.tt-msg { font-size: 13px; color: #f5f5f5; }
.tt-bar {
  height: 3px;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  transform-origin: left;
  animation: ttBar 3.5s linear infinite;
}
@keyframes ttSlide {
  0%   { transform: translateY(16px); opacity: 0; }
  12%  { transform: translateY(0); opacity: 1; }
  88%  { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(16px); opacity: 0; }
}
@keyframes ttBar {
  0%   { transform: scaleX(1); }
  100% { transform: scaleX(0); }
}\`,
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
`;

fs.writeFileSync('D:/Projects/toolninja.io/lib/animations.ts', content, 'utf8');
console.log('Done. Size:', fs.statSync('D:/Projects/toolninja.io/lib/animations.ts').size, 'bytes');
