"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-5 border-t border-[#1e1e1e] mt-8">
      <span className="text-xs text-[#555555] mr-1">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] border border-[#222222] rounded text-xs text-[#888888] hover:text-[#f5f5f5] hover:border-[#a855f7] transition-colors"
      >
        𝕏 Twitter
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] border border-[#222222] rounded text-xs text-[#888888] hover:text-[#f5f5f5] hover:border-[#a855f7] transition-colors"
      >
        in LinkedIn
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] border border-[#222222] rounded text-xs text-[#888888] hover:text-[#f5f5f5] hover:border-[#a855f7] transition-colors"
      >
        {copied ? "✓ Copied!" : "🔗 Copy Link"}
      </button>
    </div>
  );
}
