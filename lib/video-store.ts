import { unstable_cache, revalidateTag } from "next/cache";
import { kv, safe } from "@/lib/kv";
import { tools } from "@/lib/tools";
import { DEFAULT_VIDEOS, sortVideos, type Video } from "@/lib/videos";

// The video list, edited in /admin/videos. Pages read a cached copy; saving revalidates the "videos"
// tag so tool pages, /ask and /videos show the change within seconds, without a deploy.

const KEY = "tn:videos";
export const VIDEOS_TAG = "videos";

async function load(): Promise<Video[]> {
  const raw = await safe(() => kv().get(KEY), null);
  if (!raw) return DEFAULT_VIDEOS;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) return sortVideos(list as Video[]);
  } catch {}
  return DEFAULT_VIDEOS;
}

/** Cached for pages; refreshed whenever an admin saves. */
export const getVideos = unstable_cache(load, ["videos", "v1"], { tags: [VIDEOS_TAG], revalidate: 3600 });

/** Uncached, for the admin page and the newsletter. */
export const getVideosFresh = load;

async function write(list: Video[]) {
  await kv().set(KEY, JSON.stringify(sortVideos(list)));
  revalidateTag(VIDEOS_TAG);
}

/** Adds the video, or replaces the one with the same id */
export async function saveVideo(v: Video) {
  await write([...(await load()).filter((x) => x.id !== v.id), v]);
}

export async function removeVideo(id: string) {
  await write((await load()).filter((x) => x.id !== id));
}

/** Pages a video can belong to */
export function videoPages(): { path: string; name: string }[] {
  return [{ path: "/ask", name: "Ask Ninja" }, ...tools.map((t) => ({ path: `/tools/${t.slug}`, name: t.name })).sort((a, b) => a.name.localeCompare(b.name))];
}

export const isVideoPage = (page: string) => page === "/ask" || (page.startsWith("/tools/") && tools.some((t) => `/tools/${t.slug}` === page));
