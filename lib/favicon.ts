export interface FaviconSize {
  size: number;
  filename: string;
  label: string;
}

export const FAVICON_SIZES: FaviconSize[] = [
  { size: 16, filename: "favicon-16x16.png", label: "Browser tab (16×16)" },
  { size: 32, filename: "favicon-32x32.png", label: "Browser tab (32×32)" },
  { size: 48, filename: "favicon-48x48.png", label: "Windows taskbar (48×48)" },
  { size: 180, filename: "apple-touch-icon.png", label: "Apple touch icon (180×180)" },
  { size: 192, filename: "android-chrome-192x192.png", label: "Android / manifest (192×192)" },
  { size: 512, filename: "android-chrome-512x512.png", label: "Android / manifest (512×512)" },
];

/** Renders an image into a square PNG of the given size, contained (aspect-preserved,
 * centered), with an optional solid background fill. Returns a data URL. */
export function renderFaviconSize(image: HTMLImageElement, size: number, bgColor: string | null): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.drawImage(image, x, y, w, h);

  return canvas.toDataURL("image/png");
}

export interface WebManifestOptions {
  name: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
}

export function buildWebManifest(opts: WebManifestOptions): string {
  const manifest = {
    name: opts.name,
    short_name: opts.shortName,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: opts.themeColor,
    background_color: opts.backgroundColor,
    display: opts.display,
  };
  return JSON.stringify(manifest, null, 2);
}

export function buildFaviconHtmlSnippet(): string {
  return [
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">',
    '<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">',
    '<link rel="manifest" href="/site.webmanifest">',
  ].join("\n");
}
