// Reads what /admin/videos needs from YouTube's public pages, with no API key: oEmbed gives the title
// and the player shape (taller than wide = a Short), the watch page gives the length, upload date and
// description. Server-only (the admin's browser can't fetch YouTube under the admin CSP).

import type { Video } from "@/lib/videos";

/** Accepts a bare id or any YouTube link: watch?v=, youtu.be/, /shorts/, /embed/, /live/ */
export function parseVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = u.searchParams.get("v");
    const m = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(u.pathname);
    if (!id && m) id = m[1];
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** A JSON string value from the watch page's embedded player data, e.g. "lengthSeconds":"33" */
function jsonString(html: string, key: string): string | null {
  const m = new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`).exec(html);
  if (!m) return null;
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return null;
  }
}

export function parseWatchPage(html: string): { durationSec: number | null; uploadDate: string | null; description: string } {
  const len = jsonString(html, "lengthSeconds");
  let date = jsonString(html, "uploadDate") ?? jsonString(html, "publishDate");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) date += "T00:00:00Z";
  return {
    durationSec: len && /^\d+$/.test(len) ? Number(len) : null,
    uploadDate: date,
    description: jsonString(html, "shortDescription") ?? "",
  };
}

const EMOJI = new RegExp("[\\p{Extended_Pictographic}\\u{FE0F}\\u{200D}]", "gu");
const EMOJI_BREAK = new RegExp("([^.!?:;,\\s])\\s*[\\p{Extended_Pictographic}\\u{FE0F}\\u{200D}]+\\s+(?=\\p{Lu})", "gu");

const tidy = (s: string) =>
  s
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/(^|\s)#[\w-]+/g, " ")
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .trim();

/** "Convert JSON to a Zod Schema in 5 Seconds #shorts #toolninjaio" → without hashtags and emoji */
export const cleanTitle = (t: string) => tidy(t).replace(/[\s:|–—-]+$/, "");

/** The first real paragraph of a YouTube description, cut at a sentence end near 260 characters */
export function summarizeDescription(d: string): string {
  // A line break, or an emoji before a capital letter, ends a sentence: "Ninja here 👋 In this video…"
  const paragraph = (p: string) => {
    const lines = p
      .split("\n")
      .map((l) => tidy(l.replace(EMOJI_BREAK, "$1. ")))
      .filter(Boolean);
    return lines.map((l, i) => (i < lines.length - 1 && !/[.!?:;,]$/.test(l) ? `${l}.` : l)).join(" ");
  };
  const paragraphs = d.split(/\n\s*\n/).map(paragraph).filter(Boolean);
  const text = paragraphs.find((p) => p.length >= 40) ?? paragraphs[0] ?? "";
  if (text.length <= 260) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 260) break;
    out += s;
  }
  return (out || text.slice(0, 257) + "…").trim();
}

/** The toolninja.io page the description links to, if it's one we know */
export function suggestPage(description: string, knownPage: (page: string) => boolean): string | null {
  const re = /toolninja\.io(\/tools\/[a-z0-9-]+|\/ask)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(description))) if (knownPage(m[1])) return m[1];
  return null;
}

export type FetchedVideo = Omit<Video, "page" | "uploadDate" | "durationSec"> & {
  page: string | null;
  uploadDate: string | null;
  durationSec: number | null;
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

async function firstImage(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" }).catch(() => null);
    if (res?.ok) return url;
  }
  return null;
}

export async function fetchVideoInfo(input: string, knownPage: (page: string) => boolean): Promise<{ ok: true; video: FetchedVideo } | { ok: false; error: string }> {
  const id = parseVideoId(input);
  if (!id) return { ok: false, error: "Paste a YouTube link, like https://youtube.com/shorts/… or https://youtu.be/…" };

  const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { cache: "no-store" }).catch(() => null);
  if (!oembed) return { ok: false, error: "Couldn't reach YouTube. Try again in a moment." };
  if (!oembed.ok) return { ok: false, error: "YouTube didn't find that video. It has to be Public or Unlisted, and embedding must be allowed." };
  const meta = (await oembed.json()) as { title?: string; width?: number; height?: number };
  const format: Video["format"] = (meta.height ?? 0) > (meta.width ?? 0) ? "short" : "guide";

  const watch = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
    cache: "no-store",
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", Cookie: "CONSENT=YES+1; SOCS=CAI" },
  }).catch(() => null);
  const page = watch?.ok ? parseWatchPage(await watch.text()) : { durationSec: null, uploadDate: null, description: "" };

  const names = format === "short" ? ["oar2.jpg", "hqdefault.jpg"] : ["maxresdefault.jpg", "sddefault.jpg", "hqdefault.jpg"];
  const thumbnail = (await firstImage(names.map((n) => `https://i.ytimg.com/vi/${id}/${n}`))) ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return {
    ok: true,
    video: {
      id,
      format,
      title: cleanTitle(meta.title ?? ""),
      description: summarizeDescription(page.description),
      page: suggestPage(page.description, knownPage),
      uploadDate: page.uploadDate,
      durationSec: page.durationSec,
      thumbnail,
    },
  };
}
