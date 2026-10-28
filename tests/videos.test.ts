import { describe, expect, it, vi } from "vitest";

// Outside a Next request there's no cache to refresh
const revalidated = vi.hoisted(() => [] as string[]);
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn, revalidateTag: (tag: string) => revalidated.push(tag) }));
import { tools } from "@/lib/tools";
import { releases } from "@/lib/changelog";
import { digestItems } from "@/lib/newsletter";
import { DEFAULT_VIDEOS, embedUrl, formatDuration, isoDuration, sortVideos, validateVideo, videoJsonLd, videosBetween, videosForPage, watchUrl } from "@/lib/videos";
import { getVideosFresh, isVideoPage, removeVideo, saveVideo, videoPages } from "@/lib/video-store";
import { cleanTitle, parseVideoId, parseWatchPage, suggestPage, summarizeDescription } from "@/lib/youtube-info";

describe("default videos", () => {
  it("every video points at a real page and passes the admin checks", () => {
    for (const v of DEFAULT_VIDEOS) {
      expect(isVideoPage(v.page), `${v.id} → ${v.page}`).toBe(true);
      expect(validateVideo(v, isVideoPage), v.id).toEqual({ ok: true, video: v });
    }
  });

  it("ids are unique and the list is newest first", () => {
    expect(new Set(DEFAULT_VIDEOS.map((v) => v.id)).size).toBe(DEFAULT_VIDEOS.length);
    expect(sortVideos(DEFAULT_VIDEOS)).toEqual(DEFAULT_VIDEOS);
  });

  it("finds the videos for a page", () => {
    expect(videosForPage(DEFAULT_VIDEOS, "/tools/json-to-zod").map((v) => v.id)).toEqual(["qOP6louzZ9o"]);
    expect(videosForPage(DEFAULT_VIDEOS, "/tools/base64")).toEqual([]);
  });
});

describe("video helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(33)).toBe("0:33");
    expect(formatDuration(125)).toBe("2:05");
    expect(isoDuration(33)).toBe("PT33S");
    expect(isoDuration(125)).toBe("PT2M5S");
    expect(isoDuration(120)).toBe("PT2M");
    expect(isoDuration(0)).toBe("PT0S");
  });

  it("uses the privacy-enhanced player and the right watch URL", () => {
    const short = DEFAULT_VIDEOS[0];
    expect(embedUrl(short)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    expect(watchUrl(short)).toBe(`https://www.youtube.com/shorts/${short.id}`);
    expect(watchUrl({ ...short, format: "guide" })).toBe(`https://www.youtube.com/watch?v=${short.id}`);
  });

  it("builds VideoObject markup with Google's required fields", () => {
    const v = DEFAULT_VIDEOS[0];
    expect(videoJsonLd(v, "https://toolninja.io")).toMatchObject({ "@type": "VideoObject", name: v.title, uploadDate: v.uploadDate, thumbnailUrl: [v.thumbnail], duration: "PT33S" });
  });

  it("picks videos by upload day", () => {
    expect(videosBetween(DEFAULT_VIDEOS, "2026-10-24", undefined).map((v) => v.id)).toEqual(["VJck2Ym2YDQ"]);
    expect(videosBetween(DEFAULT_VIDEOS, "2026-10-21", "2026-10-22").map((v) => v.id)).toEqual(["nSmTNrC_o-A"]);
  });
});

describe("admin checks", () => {
  const good = DEFAULT_VIDEOS[0];

  it("rejects bad input with a readable reason", () => {
    expect(validateVideo({ ...good, id: "nope" }, isVideoPage)).toMatchObject({ ok: false });
    expect(validateVideo({ ...good, page: "/tools/does-not-exist" }, isVideoPage)).toEqual({ ok: false, error: "Pick the page the video belongs to." });
    expect(validateVideo({ ...good, page: "" }, isVideoPage)).toMatchObject({ ok: false });
    expect(validateVideo({ ...good, title: "  " }, isVideoPage)).toMatchObject({ ok: false });
    expect(validateVideo({ ...good, durationSec: NaN }, isVideoPage)).toMatchObject({ ok: false });
    expect(validateVideo({ ...good, uploadDate: "" }, isVideoPage)).toMatchObject({ ok: false });
    // The thumbnail must be YouTube's image for this very video (it's fetched by our image optimizer)
    expect(validateVideo({ ...good, thumbnail: "https://evil.example/x.jpg" }, isVideoPage)).toMatchObject({ ok: false });
    expect(validateVideo({ ...good, thumbnail: "https://i.ytimg.com/vi/AAAAAAAAAAA/oar2.jpg" }, isVideoPage)).toMatchObject({ ok: false });
  });

  it("offers every tool plus Ask Ninja as a page", () => {
    const pages = videoPages();
    expect(pages[0]).toEqual({ path: "/ask", name: "Ask Ninja" });
    expect(pages).toHaveLength(tools.length + 1);
    expect(pages.every((p) => isVideoPage(p.path))).toBe(true);
  });

  it("saves, replaces and removes videos in storage", async () => {
    const extra = { ...good, id: "AAAAAAAAAAA", page: "/tools/base64", uploadDate: "2026-10-28T10:00:00-07:00", thumbnail: "https://i.ytimg.com/vi/AAAAAAAAAAA/oar2.jpg" };
    await saveVideo(extra);
    let list = await getVideosFresh();
    expect(list[0].id).toBe("AAAAAAAAAAA");
    expect(list).toHaveLength(DEFAULT_VIDEOS.length + 1);
    await saveVideo({ ...extra, title: "Renamed" });
    list = await getVideosFresh();
    expect(list.filter((v) => v.id === "AAAAAAAAAAA").map((v) => v.title)).toEqual(["Renamed"]);
    await removeVideo("AAAAAAAAAAA");
    expect((await getVideosFresh()).map((v) => v.id)).toEqual(DEFAULT_VIDEOS.map((v) => v.id));
    // Every change refreshes the pages that show videos
    expect(revalidated).toEqual(["videos", "videos", "videos"]);
  });
});

describe("reading YouTube", () => {
  it("accepts every common link form", () => {
    for (const url of [
      "https://youtube.com/shorts/VJck2Ym2YDQ",
      "https://www.youtube.com/shorts/VJck2Ym2YDQ?si=abc",
      "youtube.com/watch?v=VJck2Ym2YDQ&t=3",
      "https://m.youtube.com/watch?v=VJck2Ym2YDQ",
      "https://youtu.be/VJck2Ym2YDQ?si=x",
      "https://www.youtube-nocookie.com/embed/VJck2Ym2YDQ",
      "VJck2Ym2YDQ",
    ])
      expect(parseVideoId(url), url).toBe("VJck2Ym2YDQ");
    expect(parseVideoId("https://vimeo.com/123")).toBeNull();
    expect(parseVideoId("https://youtube.com/@ToolNinjaIO")).toBeNull();
  });

  it("reads length, date and description from the watch page", () => {
    const html = `…"lengthSeconds":"33",…"shortDescription":"Line one \\"quoted\\".\\n\\nhttps://toolninja.io/tools/json-to-zod",…"uploadDate":"2026-10-27T00:04:46-07:00"…`;
    expect(parseWatchPage(html)).toEqual({ durationSec: 33, uploadDate: "2026-10-27T00:04:46-07:00", description: 'Line one "quoted".\n\nhttps://toolninja.io/tools/json-to-zod' });
    expect(parseWatchPage(`"publishDate":"2026-10-27"`).uploadDate).toBe("2026-10-27T00:00:00Z");
    expect(parseWatchPage("nothing here")).toEqual({ durationSec: null, uploadDate: null, description: "" });
  });

  it("cleans titles and descriptions for the site", () => {
    expect(cleanTitle("Convert JSON to a Zod Schema in 5 Seconds #shorts #toolninjaio")).toBe("Convert JSON to a Zod Schema in 5 Seconds");
    expect(cleanTitle("Your MCP Server Won’t Start? Fix the Config in Seconds 🥷 #shorts")).toBe("Your MCP Server Won’t Start? Fix the Config in Seconds");
    expect(summarizeDescription("⚡ New\n\nPaste a sample JSON response and get a Zod schema. Works offline. 🔥\n\n✅ More\n#zod")).toBe(
      "Paste a sample JSON response and get a Zod schema. Works offline."
    );
    expect(summarizeDescription("Hey! Ninja here 🥷\nIn this video I walk you through five new features on the site.")).toBe(
      "Hey! Ninja here. In this video I walk you through five new features on the site."
    );
    expect(summarizeDescription("Hey! Ninja here 👋 In this video I walk you through five new features 🔥 on the site.")).toBe(
      "Hey! Ninja here. In this video I walk you through five new features on the site."
    );
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const out = summarizeDescription(long);
    expect(out.length).toBeLessThanOrEqual(260);
    expect(out.endsWith(".")).toBe(true);
  });

  it("suggests the page linked in the description", () => {
    expect(suggestPage("Try it: https://toolninja.io/tools/json-to-zod\nMore: https://toolninja.io", isVideoPage)).toBe("/tools/json-to-zod");
    expect(suggestPage("https://toolninja.io/tools/not-a-tool then https://toolninja.io/ask", isVideoPage)).toBe("/ask");
    expect(suggestPage("no links", isVideoPage)).toBeNull();
  });
});

describe("newsletter", () => {
  it("lists each video in exactly one release's newsletter", () => {
    const counted = new Map<string, number>();
    for (const r of releases) {
      for (const i of digestItems(r, "https://toolninja.io", DEFAULT_VIDEOS).filter((i) => i.kind === "video")) counted.set(i.title, (counted.get(i.title) ?? 0) + 1);
    }
    const oldest = releases[releases.length - 1].date;
    for (const v of DEFAULT_VIDEOS.filter((v) => v.uploadDate.slice(0, 10) > oldest)) expect(counted.get(v.title), v.title).toBe(1);
  });

  it("links each video to the page that plays it", () => {
    const item = digestItems(releases[0], "https://toolninja.io", DEFAULT_VIDEOS).find((i) => i.kind === "video");
    if (item) expect(item.url).toMatch(/^https:\/\/toolninja\.io\/(tools\/|ask)/);
  });
});
