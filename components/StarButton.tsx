"use client";

import { useState, useEffect } from "react";
import { toggleFavorite, isFavorite } from "@/lib/user-prefs";

interface StarButtonProps {
  slug: string;
  size?: "sm" | "md";
}

export default function StarButton({ slug, size = "sm" }: StarButtonProps) {
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    setStarred(isFavorite(slug));
  }, [slug]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(slug);
    setStarred(next);
  };

  return (
    <button
      onClick={handleClick}
      title={starred ? "Remove from favorites" : "Add to favorites"}
      className={`transition-colors rounded p-0.5 leading-none ${
        starred
          ? "text-[#f59e0b] hover:text-[#d97706]"
          : "text-[#333333] hover:text-[#888888]"
      } ${size === "md" ? "text-xl" : "text-base"}`}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}
