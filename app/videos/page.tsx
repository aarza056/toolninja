import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/lib/tools";
import { type Video, YOUTUBE_CHANNEL_URL, embedUrl, formatDuration } from "@/lib/videos";
import { getVideos } from "@/lib/video-store";
import YouTubePlayer from "@/components/videos/YouTubePlayer";
import { YouTubeIcon } from "@/components/videos/PageVideos";

const PAGE_URL = "https://toolninja.io/videos";
const TITLE = "Video Guides — Free Developer Tools in Action";
const DESCRIPTION =
  "Short video guides for ToolNinja's free developer tools: check Node.js 26 upgrades, fix MCP configs, decode SSL certificates, generate Zod schemas and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: `${TITLE} | ToolNinja`, description: DESCRIPTION, url: PAGE_URL },
};

function pageName(page: string): string {
  if (page === "/ask") return "Ask Ninja";
  const slug = page.replace(/^\/tools\//, "");
  return tools.find((t) => t.slug === slug)?.name ?? page;
}

function VideoCard({ video }: { video: Video }) {
  const vertical = video.format === "short";
  return (
    <div className="space-y-2.5">
      <YouTubePlayer
        src={embedUrl(video)}
        thumbnail={video.thumbnail}
        title={video.title}
        duration={formatDuration(video.durationSec)}
        vertical={vertical}
        sizes={vertical ? "(max-width: 640px) 50vw, 240px" : "(max-width: 768px) 100vw, 480px"}
      />
      <p className="text-sm text-[#cccccc] leading-snug">{video.title}</p>
      <Link href={video.page} className="inline-block text-xs text-[#a855f7] hover:underline">
        Open {pageName(video.page)} →
      </Link>
    </div>
  );
}

export default async function VideosPage() {
  const videos = await getVideos();
  const shorts = videos.filter((v) => v.format === "short");
  const guides = videos.filter((v) => v.format === "guide");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-[#555555] mb-3">
          <Link href="/" className="hover:text-[#888888] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#f5f5f5]">Videos</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-3">Video guides</h1>
        <p className="text-[#888888] text-base leading-relaxed mb-4">
          See the tools in action, in under a minute each. Every tool runs in your browser: no login, nothing uploaded.
        </p>
        <a
          href={`${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#111111] border border-[#ff4d4d]/30 rounded-lg text-[#ff6b6b] hover:border-[#ff4d4d]/60 transition-colors"
        >
          <YouTubeIcon size={15} />
          Subscribe on YouTube
        </a>
      </div>

      {guides.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Shorts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {shorts.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      </section>
    </div>
  );
}
