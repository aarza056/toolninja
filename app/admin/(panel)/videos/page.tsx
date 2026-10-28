import type { Metadata } from "next";
import { getVideosFresh, videoPages } from "@/lib/video-store";
import VideoManager from "./VideoManager";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";

export default async function VideosAdmin() {
  return <VideoManager videos={await getVideosFresh()} pages={videoPages()} />;
}
