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
      type="button"
      onClick={handleClick}
      title={starred ? "Remove from favorites" : "Add to favorites"}
      aria-label={starred ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={starred}
      className={`transition-colors rounded leading-none min-w-[24px] min-h-[24px] inline-flex items-center justify-center ${
        starred
          ? "text-[#f59e0b] hover:text-[#d97706]"
          : "text-[#777777] hover:text-[#bbbbbb]"
      } ${size === "md" ? "text-xl" : "text-base"}`}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}
