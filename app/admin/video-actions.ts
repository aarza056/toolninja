"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { safe } from "@/lib/kv";
import { notify } from "@/lib/telegram";
import { escapeHtml } from "@/lib/newsletter-template";
import { validateVideo, type Video } from "@/lib/videos";
import { isVideoPage, removeVideo, saveVideo } from "@/lib/video-store";
import { fetchVideoInfo, type FetchedVideo } from "@/lib/youtube-info";

export async function fetchVideo(url: string): Promise<{ ok: true; video: FetchedVideo } | { ok: false; error: string }> {
  await requireAdmin();
  return fetchVideoInfo(String(url ?? "").slice(0, 500), isVideoPage);
}

export async function saveVideoAction(input: Partial<Video>, isNew: boolean): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const r = validateVideo(input, isVideoPage);
  if (!r.ok) return r;
  await saveVideo(r.video);
  revalidatePath("/admin/videos");
  if (isNew) await safe(() => notify(`🎬 <b>Video added</b> to ${r.video.page}\n“${escapeHtml(r.video.title)}”`), false);
  return { ok: true };
}

export async function removeVideoAction(id: string): Promise<void> {
  await requireAdmin();
  await removeVideo(String(id ?? ""));
  revalidatePath("/admin/videos");
}
