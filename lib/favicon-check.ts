// The parts of the Favicon Checker with no network in them: finding icon declarations in a page's
// HTML and a web app manifest, reading an image's real format and size from its first bytes, and
// turning what was found into a checklist. Used by /api/favicon-check; safe in client code too.

export interface DeclaredIcon {
  /** Absolute URL */
  href: string;
  rel: string;
  sizes?: string;
  type?: string;
  purpose?: string;
  source: "html" | "manifest" | "default";
}

export interface PageIcons {
  icons: DeclaredIcon[];
  manifest: string | null;
  themeColor: string | null;
  baseHref: string;
}

const attr = (tag: string, name: string): string | undefined => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

const decodeEntities = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function resolve(href: string, base: string): string | null {
  try {
    const u = new URL(decodeEntities(href.trim()), base);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "data:" ? u.href : null;
  } catch {
    return null;
  }
}

const ICON_RELS = ["icon", "shortcut icon", "apple-touch-icon", "apple-touch-icon-precomposed", "mask-icon", "fluid-icon"];

export function readPageIcons(html: string, pageUrl: string): PageIcons {
  const head = html.slice(0, 512 * 1024);
  let base = pageUrl;
  const baseTag = /<base\b[^>]*>/i.exec(head);
  const baseHref = baseTag ? attr(baseTag[0], "href") : undefined;
  if (baseHref) base = resolve(baseHref, pageUrl) ?? pageUrl;
  const icons: DeclaredIcon[] = [];
  let manifest: string | null = null;
  const linkRe = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(head))) {
    const tag = m[0];
    const rel = (attr(tag, "rel") ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    const href = attr(tag, "href");
    if (!href) continue;
    if (rel === "manifest") {
      manifest = manifest ?? resolve(href, base);
      continue;
    }
    const relKey = ICON_RELS.find((r) => rel === r) ?? (rel.split(" ").includes("icon") ? "icon" : null);
    if (!relKey) continue;
    const abs = resolve(href, base);
    if (!abs) continue;
    icons.push({ href: abs, rel: relKey, sizes: attr(tag, "sizes"), type: attr(tag, "type"), source: "html" });
  }
  const theme = /<meta\b[^>]*name\s*=\s*["']?theme-color["']?[^>]*>/i.exec(head);
  return { icons, manifest, themeColor: theme ? (attr(theme[0], "content") ?? null) : null, baseHref: base };
}

export interface ManifestInfo {
  name?: string;
  icons: DeclaredIcon[];
  error?: string;
}

export function readManifest(text: string, manifestUrl: string): ManifestInfo {
  let j: { name?: unknown; short_name?: unknown; icons?: unknown };
  try {
    j = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return { icons: [], error: "The manifest isn't valid JSON." };
  }
  const icons: DeclaredIcon[] = [];
  if (Array.isArray(j.icons)) {
    for (const i of j.icons as { src?: unknown; sizes?: unknown; type?: unknown; purpose?: unknown }[]) {
      if (!i || typeof i.src !== "string") continue;
      const abs = resolve(i.src, manifestUrl);
      if (!abs) continue;
      icons.push({ href: abs, rel: "manifest", sizes: typeof i.sizes === "string" ? i.sizes : undefined, type: typeof i.type === "string" ? i.type : undefined, purpose: typeof i.purpose === "string" ? i.purpose : undefined, source: "manifest" });
    }
  }
  const name = typeof j.name === "string" ? j.name : typeof j.short_name === "string" ? j.short_name : undefined;
  return { name, icons, error: Array.isArray(j.icons) ? undefined : "The manifest has no icons array." };
}

export interface ImageInfo {
  format: "png" | "ico" | "svg" | "gif" | "jpeg" | "webp" | "bmp" | "avif" | "unknown";
  width?: number;
  height?: number;
  /** Every image inside an .ico file */
  frames?: { width: number; height: number; bpp: number; png: boolean }[];
}

const u16le = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u24le = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + ((b[o + 3] << 24) >>> 0);
const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode.apply(null, Array.from(b.subarray(o, o + n)));

function svgSize(text: string): { width?: number; height?: number } {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0] ?? "";
  const num = (v?: string) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? Math.round(parseFloat(v)) : undefined);
  let width = num(attr(tag, "width"));
  let height = num(attr(tag, "height"));
  const vb = attr(tag, "viewBox");
  if ((!width || !height) && vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p.every((x) => Number.isFinite(x))) {
      width = width ?? Math.round(p[2]);
      height = height ?? Math.round(p[3]);
    }
  }
  return { width, height };
}

export function readImage(b: Uint8Array): ImageInfo {
  if (b.length >= 24 && b[0] === 0x89 && ascii(b, 1, 3) === "PNG") return { format: "png", width: u32be(b, 16), height: u32be(b, 20) };
  if (b.length >= 6 && u16le(b, 0) === 0 && (u16le(b, 2) === 1 || u16le(b, 2) === 2)) {
    const count = u16le(b, 4);
    if (count > 0 && count < 256 && b.length >= 6 + count * 16) {
      const frames: ImageInfo["frames"] = [];
      for (let i = 0; i < count; i++) {
        const o = 6 + i * 16;
        const off = u32le(b, o + 12);
        const png = off + 8 <= b.length && b[off] === 0x89 && ascii(b, off + 1, 3) === "PNG";
        frames.push({ width: b[o] || 256, height: b[o + 1] || 256, bpp: u16le(b, o + 6), png });
      }
      const big = frames.reduce((a, f) => (f.width > a.width ? f : a), frames[0]);
      return { format: "ico", width: big.width, height: big.height, frames };
    }
  }
  if (b.length >= 10 && ascii(b, 0, 3) === "GIF") return { format: "gif", width: u16le(b, 6), height: u16le(b, 8) };
  if (b.length >= 26 && ascii(b, 0, 2) === "BM") return { format: "bmp", width: u32le(b, 18), height: Math.abs(u32le(b, 22) | 0) };
  if (b.length >= 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    const chunk = ascii(b, 12, 4);
    if (chunk === "VP8X") return { format: "webp", width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
    if (chunk === "VP8L") {
      const bits = u32le(b, 21);
      return { format: "webp", width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 ") return { format: "webp", width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
    return { format: "webp" };
  }
  if (b.length >= 12 && ascii(b, 4, 4) === "ftyp" && /avi[fs]/.test(ascii(b, 8, 4))) return { format: "avif" };
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = b[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { format: "jpeg", height: u16be(b, o + 5), width: u16be(b, o + 7) };
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        o += 2;
        continue;
      }
      o += 2 + u16be(b, o + 2);
    }
    return { format: "jpeg" };
  }
  const text = new TextDecoder().decode(b.subarray(0, 4096)).replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg\b/i.test(text)) return { format: "svg", ...svgSize(text) };
  return { format: "unknown" };
}

export interface CheckedIcon extends DeclaredIcon {
  status: number | null;
  error?: string;
  contentType?: string;
  bytes?: number;
  image?: ImageInfo;
  finalUrl?: string;
}

export interface FaviconReport {
  pageUrl: string;
  pageStatus: number;
  icons: CheckedIcon[];
  manifestUrl: string | null;
  manifest: ManifestInfo | null;
  manifestStatus: number | null;
  themeColor: string | null;
}

export type CheckState = "pass" | "warn" | "fail" | "info";

export interface FaviconCheck {
  id: string;
  state: CheckState;
  title: string;
  detail: string;
}

const MIME: Record<ImageInfo["format"], RegExp> = {
  png: /image\/png/i,
  ico: /image\/(x-icon|vnd\.microsoft\.icon|ico|icon)/i,
  svg: /image\/svg\+xml/i,
  gif: /image\/gif/i,
  jpeg: /image\/jpe?g/i,
  webp: /image\/webp/i,
  bmp: /image\/(bmp|x-ms-bmp)/i,
  avif: /image\/avif/i,
  unknown: /^$/,
};

export const iconOk = (i: CheckedIcon) => i.status !== null && i.status >= 200 && i.status < 300 && !!i.image && i.image.format !== "unknown";

/** Sizes an icon actually provides: every frame of an .ico, the size of anything else; "any" for SVG */
export function actualSizes(i: CheckedIcon): string[] {
  if (!i.image) return [];
  if (i.image.format === "svg") return ["any"];
  if (i.image.frames) return i.image.frames.map((f) => `${f.width}x${f.height}`);
  return i.image.width && i.image.height ? [`${i.image.width}x${i.image.height}`] : [];
}

export function evaluateFavicons(r: FaviconReport): FaviconCheck[] {
  const checks: FaviconCheck[] = [];
  const ok = r.icons.filter(iconOk);
  const root = r.icons.find((i) => i.source === "default" && /\/favicon\.ico$/.test(i.href));
  const html = r.icons.filter((i) => i.source === "html");
  const htmlIcons = html.filter((i) => i.rel === "icon" || i.rel === "shortcut icon");
  const apple = r.icons.filter((i) => i.rel === "apple-touch-icon" || i.rel === "apple-touch-icon-precomposed");
  const manifestIcons = r.icons.filter((i) => i.source === "manifest");

  // Declared links that don't load
  const broken = r.icons.filter((i) => i.source !== "default" && !iconOk(i));
  checks.push(
    broken.length
      ? { id: "broken", state: "fail", title: `${broken.length} declared icon${broken.length === 1 ? " doesn't" : "s don't"} load`, detail: broken.map((i) => `${i.href}: ${i.error ?? (i.status ? `HTTP ${i.status}` : "not an image")}`).join("\n") }
      : { id: "broken", state: "pass", title: "Every declared icon loads", detail: `${r.icons.filter((i) => i.source !== "default").length} icon link${r.icons.filter((i) => i.source !== "default").length === 1 ? "" : "s"} checked.` }
  );

  if (root && iconOk(root)) checks.push({ id: "root", state: "pass", title: "/favicon.ico exists", detail: `Browsers and tools that don't read your HTML ask for /favicon.ico. Yours has ${actualSizes(root).join(", ") || "an image"}.` });
  else checks.push({ id: "root", state: htmlIcons.some(iconOk) ? "warn" : "fail", title: "No /favicon.ico at the site root", detail: "Browsers request /favicon.ico for pages without an icon link, as do RSS readers and many other tools, so a missing one fills your logs with 404s. Put a 32×32 (or 16+32+48) .ico there." });

  // Google Search shows a favicon that is square and at least 8×8; it recommends more than 48×48
  const searchCandidates = htmlIcons.filter(iconOk);
  const goodForGoogle = searchCandidates.filter((i) => i.image!.format === "svg" || ((i.image!.width ?? 0) >= 48 && i.image!.width === i.image!.height));
  if (!htmlIcons.length) checks.push({ id: "google", state: "warn", title: "No <link rel=\"icon\"> in the page", detail: "Google Search reads the icon link on your home page. Without one it falls back to /favicon.ico, if that exists." });
  else if (goodForGoogle.length) checks.push({ id: "google", state: "pass", title: "Google Search can use your icon", detail: `${goodForGoogle[0].href} is square and ${goodForGoogle[0].image!.format === "svg" ? "a scalable SVG" : `${goodForGoogle[0].image!.width}×${goodForGoogle[0].image!.height}`}. Google recommends larger than 48×48 (a multiple of 48 is ideal).` });
  else if (searchCandidates.length) {
    const notSquare = searchCandidates.find((i) => i.image!.width !== i.image!.height);
    checks.push({ id: "google", state: "warn", title: notSquare ? "Your icon isn't square" : "Your icon is smaller than 48×48", detail: notSquare ? `${notSquare.href} is ${notSquare.image!.width}×${notSquare.image!.height}. Google Search requires a square (1:1) icon.` : "Google Search accepts icons from 8×8, but recommends larger than 48×48, so it stays sharp on high-density screens." });
  }

  const svg = htmlIcons.find((i) => iconOk(i) && i.image!.format === "svg");
  checks.push(svg ? { id: "svg", state: "pass", title: "SVG icon", detail: "Sharp at every size, and it can switch colors for dark mode with a prefers-color-scheme media query inside the SVG." } : { id: "svg", state: "info", title: "No SVG icon", detail: "Optional. An SVG icon stays sharp at any size and can adapt to dark mode; keep a PNG or .ico as well for browsers that don't use SVG icons." });

  const appleOk = apple.filter(iconOk);
  if (!apple.length) checks.push({ id: "apple", state: "warn", title: "No apple-touch-icon", detail: "iPhones and iPads use it when someone adds your site to the home screen, and iOS asks for /apple-touch-icon.png if it isn't declared. Add a 180×180 PNG without transparency." });
  else if (!appleOk.length) checks.push({ id: "apple", state: "fail", title: "apple-touch-icon doesn't load", detail: apple.map((i) => i.href).join("\n") });
  else {
    const a = appleOk[0].image!;
    const exact = a.width === 180 && a.height === 180;
    checks.push({ id: "apple", state: exact ? "pass" : "warn", title: exact ? "apple-touch-icon is 180×180" : `apple-touch-icon is ${a.width ?? "?"}×${a.height ?? "?"}`, detail: exact ? "The size current iPhones use." : "Use 180×180, the size current iPhones use. Smaller icons look blurry; larger ones are scaled down." });
    if (a.format !== "png") checks.push({ id: "apple-format", state: "warn", title: "apple-touch-icon isn't a PNG", detail: `It's ${a.format.toUpperCase()}. iOS expects a PNG.` });
  }

  if (!r.manifestUrl) checks.push({ id: "manifest", state: "info", title: "No web app manifest", detail: "Only needed if the site should be installable (Android home screen, desktop PWA). It then needs 192×192 and 512×512 icons." });
  else if (!r.manifest || r.manifestStatus === null || r.manifestStatus >= 400) checks.push({ id: "manifest", state: "fail", title: "The manifest doesn't load", detail: `${r.manifestUrl}${r.manifestStatus ? `: HTTP ${r.manifestStatus}` : ""}` });
  else if (r.manifest.error) checks.push({ id: "manifest", state: "fail", title: "The manifest has a problem", detail: r.manifest.error });
  else {
    const sizes = new Set(manifestIcons.filter(iconOk).flatMap(actualSizes));
    const has192 = sizes.has("192x192") || sizes.has("any");
    const has512 = sizes.has("512x512") || sizes.has("any");
    checks.push({ id: "manifest", state: has192 && has512 ? "pass" : "warn", title: has192 && has512 ? "Manifest has 192×192 and 512×512 icons" : "Manifest is missing a required size", detail: has192 && has512 ? "What Chrome needs to offer installing the site, and for its splash screen." : `Chrome needs a 192×192 and a 512×512 icon to make the site installable.${has192 ? "" : " 192×192 is missing."}${has512 ? "" : " 512×512 is missing."}` });
    const maskable = manifestIcons.some((i) => /maskable/.test(i.purpose ?? ""));
    checks.push(maskable ? { id: "maskable", state: "pass", title: "Maskable icon", detail: "Android can crop it to its circle or squircle shape without cutting into your logo." } : { id: "maskable", state: "info", title: "No maskable icon", detail: "Android puts non-maskable icons on a white circle. Add an icon with \"purpose\": \"maskable\" whose logo sits inside the central 80%." });
  }

  // Declared sizes and types that don't match the file
  const mismatches: string[] = [];
  for (const i of r.icons.filter(iconOk)) {
    const actual = actualSizes(i);
    if (i.sizes && i.sizes.toLowerCase() !== "any") {
      const declared = i.sizes.toLowerCase().split(/\s+/).filter(Boolean);
      const missing = declared.filter((d) => !actual.includes(d));
      if (missing.length && !actual.includes("any")) mismatches.push(`${i.href} says sizes="${i.sizes}" but is ${actual.join(", ") || "a different size"}.`);
    }
    if (i.type && !MIME[i.image!.format].test(i.type)) mismatches.push(`${i.href} says type="${i.type}" but is ${i.image!.format.toUpperCase()}.`);
    if (i.contentType && i.image!.format !== "unknown" && !MIME[i.image!.format].test(i.contentType) && !/octet-stream/.test(i.contentType)) mismatches.push(`${i.href} is ${i.image!.format.toUpperCase()} but the server sends Content-Type: ${i.contentType}.`);
  }
  checks.push(mismatches.length ? { id: "mismatch", state: "warn", title: "Declared size or type doesn't match the file", detail: mismatches.join("\n") } : { id: "mismatch", state: "pass", title: "Declared sizes and types match the files", detail: "Browsers pick icons by the sizes and type attributes, so these being right matters." });

  const heavy = ok.filter((i) => (i.bytes ?? 0) > 100 * 1024 && i.source === "html");
  if (heavy.length) checks.push({ id: "weight", state: "warn", title: "Large icon file", detail: heavy.map((i) => `${i.href} is ${Math.round((i.bytes ?? 0) / 1024)} KB. Favicons load on every page; keep them under about 20 KB.`).join("\n") });

  return checks;
}
