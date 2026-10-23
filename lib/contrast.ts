export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parses #rgb, #rrggbb, or rgb()/rgba() strings. Returns null if unparseable. */
export function parseColor(input: string): RGB | null {
  const s = input.trim();

  const hexMatch = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  const rgbMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }

  return null;
}

export function toHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

function channelLuminance(c: number): number {
  const srgb = c / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colors, from 1 (no contrast) to 21 (black vs white). */
export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface WcagResult {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  aaUiComponents: boolean;
}

/** Checks a contrast ratio against the standard WCAG 2.x thresholds. */
export function checkWcag(ratio: number): WcagResult {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    aaUiComponents: ratio >= 3,
  };
}

/** Adjusts a color's lightness by a delta (-1 to 1) while keeping hue/saturation, used to suggest a passing shade. */
export function adjustLightness({ r, g, b }: RGB, delta: number): RGB {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  if (delta >= 0) {
    return { r: clamp(r + (255 - r) * delta), g: clamp(g + (255 - g) * delta), b: clamp(b + (255 - b) * delta) };
  }
  const f = 1 + delta;
  return { r: clamp(r * f), g: clamp(g * f), b: clamp(b * f) };
}
