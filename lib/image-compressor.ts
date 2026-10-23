export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export interface CompressOptions {
  format: OutputFormat;
  quality: number; // 0-1, ignored for PNG
  maxWidth?: number;
  maxHeight?: number;
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

export function compressImage(img: HTMLImageElement, opts: CompressOptions): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if (opts.maxWidth && width > opts.maxWidth) {
      height = Math.round((height * opts.maxWidth) / width);
      width = opts.maxWidth;
    }
    if (opts.maxHeight && height > opts.maxHeight) {
      width = Math.round((width * opts.maxHeight) / height);
      height = opts.maxHeight;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas is not supported in this browser"));
      return;
    }

    if (opts.format === "image/jpeg") {
      // JPEG has no alpha channel — fill white first so transparency doesn't turn black
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, width, height });
        else reject(new Error("Compression failed"));
      },
      opts.format,
      opts.format === "image/png" ? undefined : opts.quality
    );
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
