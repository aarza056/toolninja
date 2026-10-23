export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  population: number;
}

/** Extracts dominant colors from an image using bucket quantization —
 * downscales for performance, buckets similar colors together, and
 * returns the most frequent buckets averaged back to a representative color. */
export function extractColors(img: HTMLImageElement, count = 6, sampleSize = 100): ExtractedColor[] {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, sampleSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return [];
  }

  const quant = 24;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${Math.floor(r / quant)}-${Math.floor(g / quant)}-${Math.floor(b / quant)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const total = Array.from(buckets.values()).reduce((s, b) => s + b.count, 0) || 1;
  const sorted = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count);

  return sorted.map((b) => {
    const r = Math.round(b.r / b.count);
    const g = Math.round(b.g / b.count);
    const bl = Math.round(b.b / b.count);
    return {
      hex: "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join(""),
      rgb: [r, g, bl] as [number, number, number],
      population: b.count / total,
    };
  });
}
