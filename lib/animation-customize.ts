// Rewrites a preset's CSS with the user's timing choices, adds a prefers-reduced-motion fallback and
// exports the animation as a Tailwind CSS v4 @theme block. Works on plain CSS text, so it only
// handles the patterns the presets use (rules, @keyframes, @media / @supports wrappers).

export interface AnimationOptions {
  /** 2 = twice as fast */
  speed: number;
  delayMs: number;
  easing: string; // "" keeps the preset's
  iterations: string; // "" keeps the preset's
  direction: string; // "" keeps the preset's
  reducedMotion: boolean;
}

export const DEFAULT_ANIMATION_OPTIONS: AnimationOptions = { speed: 1, delayMs: 0, easing: "", iterations: "", direction: "", reducedMotion: true };

export const EASINGS: { label: string; value: string }[] = [
  { label: "Preset's own", value: "" },
  { label: "ease", value: "ease" },
  { label: "ease-in-out", value: "ease-in-out" },
  { label: "linear", value: "linear" },
  { label: "Smooth out (expo)", value: "cubic-bezier(0.16, 1, 0.3, 1)" },
  { label: "Back (overshoot)", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  // linear() approximates a spring; supported in all current browsers (Baseline 2023)
  { label: "Spring", value: "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)" },
  { label: "Steps (8)", value: "steps(8)" },
];

const ANIMATED = /(^|[;{\s])animation(-name)?\s*:/;
const isNone = (body: string) => /(^|[;{\s])animation\s*:\s*none\b/.test(body);

function scaleTimes(value: string, speed: number): string {
  if (speed === 1) return value;
  return value.replace(/(-?\d*\.?\d+)(ms|s)\b/g, (_, n: string, unit: string) => {
    const scaled = Number(n) / speed;
    const v = unit === "s" ? scaled : Math.round(scaled);
    return `${unit === "s" ? +v.toFixed(3) : v}${unit}`;
  });
}

/** Rule blocks that start an animation, as [selector, body] — innermost blocks only. */
export function animatedRules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const selector = m[1].trim();
    if (/^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/.test(selector)) continue; // keyframe step
    if (ANIMATED.test(m[2]) && !isNone(m[2])) out.push({ selector, body: m[2] });
  }
  return out;
}

export function customizeCss(css: string, o: AnimationOptions): string {
  // 1. Tempo: scale durations and delays inside animation declarations
  let out = css.replace(/(animation(?:-duration|-delay)?\s*:\s*)([^;}]+)/g, (_, prop: string, value: string) => `${prop}${scaleTimes(value, o.speed)}`);

  // 2. Overrides as longhands at the end of each animated rule (longhands after the shorthand win)
  const overrides = (body: string) => {
    const scroll = /animation-timeline\s*:/.test(body);
    const lines: string[] = [];
    if (o.easing) lines.push(`animation-timing-function: ${o.easing};`);
    if (!scroll) {
      if (o.delayMs) lines.push(`animation-delay: ${o.delayMs}ms;`);
      if (o.iterations) lines.push(`animation-iteration-count: ${o.iterations};`);
      if (o.direction) lines.push(`animation-direction: ${o.direction};`);
    }
    return lines;
  };
  out = out.replace(/([^{}]+)\{([^{}]*)\}/g, (all, selector: string, body: string) => {
    if (/^\s*(from|to|\d+(\.\d+)?%)/.test(selector.trim()) || !ANIMATED.test(body) || isNone(body)) return all;
    const lines = overrides(body);
    if (!lines.length) return all;
    const indent = /\n(\s+)\S/.exec(body)?.[1] ?? "  ";
    const trimmed = body.replace(/\s*$/, "");
    return `${selector}{${trimmed}${trimmed.endsWith(";") || !trimmed.trim() ? "" : ";"}\n${indent}/* customized */\n${lines.map((l) => indent + l).join("\n")}\n}`;
  });

  // 3. Respect the OS "reduce motion" setting
  if (o.reducedMotion) {
    const selectors = Array.from(new Set(animatedRules(css).map((r) => r.selector)));
    if (selectors.length && !/prefers-reduced-motion/.test(css)) {
      out += `\n\n/* Users who ask their OS for less motion get the end state without the movement */\n@media (prefers-reduced-motion: reduce) {\n  ${selectors.join(",\n  ")} {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n  }\n}`;
    }
  }
  return out;
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase();

/** Tailwind CSS v4: each @keyframes becomes an animate-* utility defined in @theme. */
export function toTailwindTheme(css: string): string | null {
  const keyframes: { name: string; block: string }[] = [];
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    // Find the matching closing brace
    let depth = 0;
    let i = m.index + m[0].length - 1;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    keyframes.push({ name: m[1], block: css.slice(m.index, i + 1) });
  }
  if (!keyframes.length) return null;

  const shorthands = Array.from(css.matchAll(/animation\s*:\s*([^;}]+)/g)).flatMap((x: RegExpMatchArray) => x[1].split(/,(?![^(]*\))/).map((s: string) => s.trim()));
  const vars = keyframes.map(({ name }) => {
    const sh = shorthands.find((s) => new RegExp(`(^|\\s)${name}(\\s|$)`).test(s)) ?? `${name} 1s ease both`;
    return `  --animate-${kebab(name)}: ${sh};`;
  });
  const blocks = keyframes.map((k) => k.block.replace(/^/gm, "  ")).join("\n\n");
  const usage = keyframes.map((k) => `animate-${kebab(k.name)}`).join(", ");
  return `/* Tailwind CSS v4 — add to your main CSS file, then use: ${usage} */\n/* Only the motion moves over; keep the element's other styles from the CSS tab. */\n@theme {\n${vars.join("\n")}\n\n${blocks}\n}`;
}
