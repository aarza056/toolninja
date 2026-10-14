function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface AspectRatioResult {
  ratioW: number;
  ratioH: number;
  decimal: number;
}

export function computeRatio(width: number, height: number): AspectRatioResult {
  if (width <= 0 || height <= 0) throw new Error("Width and height must be positive numbers.");
  const divisor = gcd(Math.round(width), Math.round(height));
  return {
    ratioW: width / divisor,
    ratioH: height / divisor,
    decimal: width / height,
  };
}

export function solveDimension(knownValue: number, ratioW: number, ratioH: number, solveFor: "width" | "height"): number {
  if (ratioW <= 0 || ratioH <= 0) throw new Error("Ratio values must be positive.");
  if (knownValue <= 0) throw new Error("The known dimension must be a positive number.");
  return solveFor === "width" ? (knownValue * ratioW) / ratioH : (knownValue * ratioH) / ratioW;
}

export const ASPECT_RATIO_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "16:9 (widescreen video)", w: 16, h: 9 },
  { label: "9:16 (vertical / Reels)", w: 9, h: 16 },
  { label: "4:3 (classic video)", w: 4, h: 3 },
  { label: "1:1 (square)", w: 1, h: 1 },
  { label: "3:2 (photo)", w: 3, h: 2 },
  { label: "21:9 (ultrawide)", w: 21, h: 9 },
  { label: "4:5 (portrait social)", w: 4, h: 5 },
];
