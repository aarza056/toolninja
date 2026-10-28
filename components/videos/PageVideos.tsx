import YouTubePlayer from "@/components/videos/YouTubePlayer";
import { type Video, YOUTUBE_CHANNEL_URL, embedUrl, formatDuration, videoJsonLd, watchUrl } from "@/lib/videos";

const BASE_URL = "https://toolninja.io";

export function YouTubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  );
}

function VideoJsonLd({ video }: { video: Video }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd(video, BASE_URL)) }} />;
}

function VideoLinks({ video }: { video: Video }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <a href={watchUrl(video)} target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#a855f7] transition-colors">
        Watch on YouTube ↗
      </a>
      <a
        href={`${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[#ff6b6b] hover:text-[#ff8a8a] transition-colors"
      >
        <YouTubeIcon size={13} /> Subscribe
      </a>
    </div>
  );
}

/** A vertical Short: beside the page text on wide screens, above it on narrow ones */
export function ShortVideo({ video, heading = "See it in action" }: { video: Video; heading?: string }) {
  return (
    <figure className="space-y-3">
      <VideoJsonLd video={video} />
      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">
        {heading} <span className="font-mono normal-case tracking-normal text-[#444]">· {formatDuration(video.durationSec)}</span>
      </h2>
      <YouTubePlayer
        src={embedUrl(video)}
        thumbnail={video.thumbnail}
        title={video.title}
        duration={formatDuration(video.durationSec)}
        vertical
        sizes="280px"
      />
      <figcaption className="space-y-2">
        <p className="text-sm text-[#888] leading-snug">{video.title}</p>
        <VideoLinks video={video} />
      </figcaption>
    </figure>
  );
}

/** A landscape guide: full width under the tool */
export function GuideVideo({ video }: { video: Video }) {
  return (
    <section className="space-y-3">
      <VideoJsonLd video={video} />
      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">
        Watch the guide <span className="font-mono normal-case tracking-normal text-[#444]">· {formatDuration(video.durationSec)}</span>
      </h2>
      <YouTubePlayer
        src={embedUrl(video)}
        thumbnail={video.thumbnail}
        title={video.title}
        duration={formatDuration(video.durationSec)}
        sizes="(max-width: 840px) 100vw, 768px"
      />
      <div className="space-y-2">
        <p className="text-sm text-[#888]">{video.title}</p>
        <VideoLinks video={video} />
      </div>
    </section>
  );
}
