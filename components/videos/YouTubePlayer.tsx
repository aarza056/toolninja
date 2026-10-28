"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface Props {
  /** Embed URL from lib/videos.ts (youtube-nocookie) */
  src: string;
  thumbnail: string;
  title: string;
  duration: string;
  vertical?: boolean;
  /** Image sizes hint for next/image */
  sizes: string;
}

/**
 * Click-to-play: shows our own thumbnail until clicked, so nothing loads from YouTube (and no YouTube
 * cookies are set) unless someone chooses to watch.
 */
export default function YouTubePlayer({ src, thumbnail, title, duration, vertical, sizes }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[12px] border border-[#222222] bg-black ${
        vertical ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      {playing ? (
        <iframe
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title} (${duration})`}
          className="group absolute inset-0 cursor-pointer"
        >
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#a855f7]/90 shadow-[0_0_30px_rgba(168,85,247,0.5)] transition group-hover:scale-110 group-hover:bg-[#a855f7]">
            <Play size={22} className="ml-0.5 fill-white text-white" />
          </span>
          <span className="absolute bottom-2.5 right-2.5 rounded-[4px] bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {duration}
          </span>
        </button>
      )}
    </div>
  );
}
