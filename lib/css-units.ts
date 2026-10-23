export type CssUnit = "px" | "rem" | "em" | "pt" | "%";

export const CSS_UNITS: CssUnit[] = ["px", "rem", "em", "pt", "%"];

const PT_PER_PX = 72 / 96; // 1in = 96px = 72pt

export function toPx(value: number, unit: CssUnit, basePx: number): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
    case "em":
      return value * basePx;
    case "pt":
      return value / PT_PER_PX;
    case "%":
      return (value / 100) * basePx;
  }
}

export function fromPx(px: number, unit: CssUnit, basePx: number): number {
  switch (unit) {
    case "px":
      return px;
    case "rem":
    case "em":
      return px / basePx;
    case "pt":
      return px * PT_PER_PX;
    case "%":
      return (px / basePx) * 100;
  }
}

export function convert(value: number, from: CssUnit, to: CssUnit, basePx: number): number {
  return fromPx(toPx(value, from, basePx), to, basePx);
}
