export interface FluidTypeParams {
  minSizePx: number;
  maxSizePx: number;
  minViewportPx: number;
  maxViewportPx: number;
  remBase?: number;
}

export interface FluidTypeResult {
  clamp: string;
  slope: number;
  yIntersectionPx: number;
}

function trimNumber(n: number): string {
  return n.toFixed(4).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function buildClamp(params: FluidTypeParams): FluidTypeResult {
  const { minSizePx, maxSizePx, minViewportPx, maxViewportPx, remBase = 16 } = params;
  if (maxViewportPx <= minViewportPx) throw new Error("Max viewport must be greater than min viewport.");
  if (maxSizePx < minSizePx) throw new Error("Max font size must be greater than or equal to min font size.");

  const slope = (maxSizePx - minSizePx) / (maxViewportPx - minViewportPx);
  const yIntersectionPx = -minViewportPx * slope + minSizePx;

  const minRem = trimNumber(minSizePx / remBase);
  const maxRem = trimNumber(maxSizePx / remBase);
  const yRem = trimNumber(yIntersectionPx / remBase);
  const vw = trimNumber(slope * 100);

  const preferred = yIntersectionPx === 0 ? `${vw}vw` : `${yRem}rem + ${vw}vw`;
  return { clamp: `clamp(${minRem}rem, ${preferred}, ${maxRem}rem)`, slope, yIntersectionPx };
}

export interface ScaleStep {
  label: string;
  minSizePx: number;
  maxSizePx: number;
}

/** Builds a type scale using a fixed ratio per step, scaled proportionally between the min and
 * max viewport base sizes — e.g. a 1.25 ratio with base 16/18 produces a classic "Major Third"-ish
 * progression that also grows fluidly with viewport width. */
export function buildScale(baseMinPx: number, baseMaxPx: number, ratio: number, steps: { label: string; power: number }[]): ScaleStep[] {
  return steps.map((s) => ({
    label: s.label,
    minSizePx: baseMinPx * Math.pow(ratio, s.power),
    maxSizePx: baseMaxPx * Math.pow(ratio, s.power),
  }));
}
