// YouTube videos shown on toolninja.io: on the page they belong to (a Short beside the guide text, a
// landscape guide under the tool) and all together on /videos. The list is edited in /admin/videos and
// kept in storage (lib/video-store.ts); DEFAULT_VIDEOS is the starting list until the first save.
// This file has no server imports, so client components can use the constants and helpers.

export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@ToolNinjaIO";

export interface Video {
  /** YouTube video id */
  id: string;
  /** "short" = vertical 9:16, "guide" = landscape 16:9 */
  format: "short" | "guide";
  title: string;
  /** One or two sentences, shown on /videos and sent to Google for video results */
  description: string;
  /** The page it belongs to: /tools/<slug> or /ask */
  page: string;
  /** As YouTube reports it, ISO 8601 with offset */
  uploadDate: string;
  durationSec: number;
  /** i.ytimg.com image; served through next/image, so visitors never load it from YouTube */
  thumbnail: string;
}

const thumb = (id: string, name: string) => `https://i.ytimg.com/vi/${id}/${name}`;

export const DEFAULT_VIDEOS: Video[] = [
  {
    id: "VJck2Ym2YDQ",
    format: "short",
    title: "Node.js 26 LTS Is Here: What Breaks in Your App?",
    description:
      "Paste your package.json and code into the Node.js 26 Upgrade Checker and see every removed API, dead package and engines range that breaks on Node 26, line by line, with the fix.",
    page: "/tools/node-26-upgrade-checker",
    uploadDate: "2026-10-27T00:04:46-07:00",
    durationSec: 33,
    thumbnail: thumb("VJck2Ym2YDQ", "oar2.jpg"),
  },
  {
    id: "SbBhrfpdpMI",
    format: "short",
    title: "Your MCP Server Won't Start? Fix the Config in Seconds",
    description:
      "MCP server not loading in Claude Code, Claude Desktop or Cursor? Paste the config into the MCP Config Generator to find the broken command, args or env, and get a working version.",
    page: "/tools/mcp-config-generator",
    uploadDate: "2026-10-24T13:05:37-07:00",
    durationSec: 43,
    thumbnail: thumb("SbBhrfpdpMI", "oar2.jpg"),
  },
  {
    id: "nSmTNrC_o-A",
    format: "short",
    title: "When Does Your SSL Certificate Expire? Check in One Paste",
    description:
      "Paste a PEM certificate into the Certificate Decoder to see when it expires, who issued it, every domain it covers and its fingerprints, without the 80 lines of openssl output.",
    page: "/tools/certificate-decoder",
    uploadDate: "2026-10-22T13:42:18-07:00",
    durationSec: 32,
    thumbnail: thumb("nSmTNrC_o-A", "oar2.jpg"),
  },
  {
    id: "sZV6tRSQVxg",
    format: "short",
    title: "Paste Anything, and Ninja Tells You What It Is",
    description:
      "Paste a JWT, a connection string, an error or anything else into Ask Ninja: it recognizes and decodes it in your browser and points you to the right tool.",
    page: "/ask",
    uploadDate: "2026-10-21T21:51:15-07:00",
    durationSec: 45,
    thumbnail: thumb("sZV6tRSQVxg", "oar2.jpg"),
  },
  {
    id: "qOP6louzZ9o",
    format: "short",
    title: "Convert JSON to a Zod Schema in 5 Seconds",
    description:
      "Paste a sample JSON response and get a ready-to-use Zod schema plus its TypeScript type, with nested objects, arrays and optional fields handled.",
    page: "/tools/json-to-zod",
    uploadDate: "2026-10-21T04:09:31-07:00",
    durationSec: 37,
    thumbnail: thumb("qOP6louzZ9o", "oar2.jpg"),
  },
];

export const videosForPage = (list: Video[], page: string) => list.filter((v) => v.page === page);

export const watchUrl = (v: Video) =>
  v.format === "short" ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;

/** Privacy-enhanced player: YouTube sets no cookies until the video is played */
export const embedUrl = (v: Video) => `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&playsinline=1&rel=0`;

/** 33 → "0:33", 125 → "2:05" */
export function formatDuration(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** 33 → "PT33S", 125 → "PT2M5S" */
export function isoDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `PT${m ? `${m}M` : ""}${s || !m ? `${s}S` : ""}`;
}

/** schema.org VideoObject, so the page can show up in Google's video results */
export function videoJsonLd(v: Video, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [v.thumbnail],
    uploadDate: v.uploadDate,
    duration: isoDuration(v.durationSec),
    contentUrl: watchUrl(v),
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    publisher: { "@type": "Organization", name: "ToolNinja", url: baseUrl },
  };
}

/** Videos uploaded after one day and up to another (YYYY-MM-DD, either may be open) */
export function videosBetween(list: Video[], after: string | undefined, until: string | undefined): Video[] {
  return list.filter((v) => {
    const day = v.uploadDate.slice(0, 10);
    return (!after || day > after) && (!until || day <= until);
  });
}

/** Newest first */
export const sortVideos = (list: Video[]) => list.slice().sort((a, b) => Date.parse(b.uploadDate) - Date.parse(a.uploadDate));

/**
 * Checks a video coming from the admin form. `knownPage` says whether a path is a real page.
 * Returns the cleaned video or the first problem found.
 */
export function validateVideo(input: Partial<Video>, knownPage: (page: string) => boolean): { ok: true; video: Video } | { ok: false; error: string } {
  const id = String(input.id ?? "").trim();
  if (!/^[\w-]{11}$/.test(id)) return { ok: false, error: "That isn't a YouTube video id." };
  const format = input.format === "guide" ? "guide" : input.format === "short" ? "short" : null;
  if (!format) return { ok: false, error: "Pick Short or horizontal guide." };
  const title = String(input.title ?? "").trim().slice(0, 120);
  if (!title) return { ok: false, error: "Add a title." };
  const description = String(input.description ?? "").trim().slice(0, 400);
  if (description.length < 20) return { ok: false, error: "Add a description of at least a sentence (Google shows it in video results)." };
  const page = String(input.page ?? "").trim();
  if (!knownPage(page)) return { ok: false, error: "Pick the page the video belongs to." };
  const uploadDate = String(input.uploadDate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(uploadDate) || Number.isNaN(Date.parse(uploadDate)))
    return { ok: false, error: "The upload date is missing. Fetch the video again." };
  const durationSec = Math.round(Number(input.durationSec));
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 6 * 3600) return { ok: false, error: "The length is missing. Fetch the video again." };
  const thumbnail = String(input.thumbnail ?? "");
  if (!thumbnail.startsWith(`https://i.ytimg.com/vi/${id}/`)) return { ok: false, error: "The thumbnail is missing. Fetch the video again." };
  return { ok: true, video: { id, format, title, description, page, uploadDate, durationSec, thumbnail } };
}
