export type ColorBlindnessType =
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "protanomaly"
  | "deuteranomaly"
  | "tritanomaly"
  | "achromatopsia";

// Machado, Oliveira & Fernandes (2009) simulation matrices for full (severity 1.0)
// dichromacy, applied in linear RGB space.
const FULL_MATRICES: Record<"protanopia" | "deuteranopia" | "tritanopia", number[]> = {
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281, 0.099216,
    -0.003882, -0.048116, 1.051998,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.01182, 0.04294, 0.968881,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779,
    -0.078411, 0.930809, 0.147602,
    0.004733, 0.691367, 0.3039,
  ],
};

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// Anomalous (partial) trichromacy approximated as a blend toward the full-dichromacy matrix —
// this is the same interpolation approach used by most browser-based simulators, since there's
// no single universally-cited matrix set for intermediate severities the way there is for the
// full form.
const ANOMALY_SEVERITY = 0.6;

function lerpMatrix(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function matrixFor(type: ColorBlindnessType): number[] | null {
  switch (type) {
    case "protanopia":
      return FULL_MATRICES.protanopia;
    case "deuteranopia":
      return FULL_MATRICES.deuteranopia;
    case "tritanopia":
      return FULL_MATRICES.tritanopia;
    case "protanomaly":
      return lerpMatrix(IDENTITY, FULL_MATRICES.protanopia, ANOMALY_SEVERITY);
    case "deuteranomaly":
      return lerpMatrix(IDENTITY, FULL_MATRICES.deuteranopia, ANOMALY_SEVERITY);
    case "tritanomaly":
      return lerpMatrix(IDENTITY, FULL_MATRICES.tritanopia, ANOMALY_SEVERITY);
    case "achromatopsia":
      return null; // handled separately via luminance
  }
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

export function simulateRgb(r: number, g: number, b: number, type: ColorBlindnessType): [number, number, number] {
  if (type === "achromatopsia") {
    // Rec. 709 luma weights — a well-established grayscale conversion, applied in linear space.
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);
    const gray = linearToSrgb(0.2126 * lr + 0.7152 * lg + 0.0722 * lb);
    return [gray, gray, gray];
  }

  const m = matrixFor(type)!;
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const outR = m[0] * lr + m[1] * lg + m[2] * lb;
  const outG = m[3] * lr + m[4] * lg + m[5] * lb;
  const outB = m[6] * lr + m[7] * lg + m[8] * lb;

  return [linearToSrgb(outR), linearToSrgb(outG), linearToSrgb(outB)];
}

export function simulateHex(hex: string, type: ColorBlindnessType): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const [nr, ng, nb] = simulateRgb(r, g, b, type);
  return "#" + [nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function simulateImageData(imageData: ImageData, type: ColorBlindnessType): ImageData {
  const data = imageData.data;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = simulateRgb(data[i], data[i + 1], data[i + 2], type);
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, imageData.width, imageData.height);
}

export const COLOR_BLINDNESS_TYPES: { id: ColorBlindnessType; label: string; description: string; prevalence: string }[] = [
  { id: "deuteranomaly", label: "Deuteranomaly", description: "Reduced sensitivity to green — the most common form", prevalence: "~5% of men" },
  { id: "protanomaly", label: "Protanomaly", description: "Reduced sensitivity to red", prevalence: "~1% of men" },
  { id: "deuteranopia", label: "Deuteranopia", description: "No green cone function — red/green confusion", prevalence: "~1% of men" },
  { id: "protanopia", label: "Protanopia", description: "No red cone function — red/green confusion, dimmer reds", prevalence: "~1% of men" },
  { id: "tritanomaly", label: "Tritanomaly", description: "Reduced sensitivity to blue — rare", prevalence: "<0.01%" },
  { id: "tritanopia", label: "Tritanopia", description: "No blue cone function — blue/yellow confusion", prevalence: "~0.01%" },
  { id: "achromatopsia", label: "Achromatopsia", description: "Complete color blindness — sees only in grayscale", prevalence: "~0.003%" },
];
