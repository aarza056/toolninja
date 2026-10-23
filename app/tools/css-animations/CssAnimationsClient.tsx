"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { animations, animationCategories, type AnimationCategory } from "@/lib/animations";
import AnimationCard from "@/components/AnimationCard";
import AnimationModal from "@/components/AnimationModal";
import type { Animation } from "@/lib/animations";

export default function CssAnimationsClient() {
  const [activeCategory, setActiveCategory] = useState<AnimationCategory>("All");
  const [previewAnimation, setPreviewAnimation] = useState<Animation | null>(null);
  const [search, setSearch] = useState("");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: animations.length };
    for (const a of animations) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const byCategory = activeCategory === "All" ? animations : animations.filter((a) => a.category === activeCategory);
    const q = search.trim().toLowerCase();
    return q ? byCategory.filter((a) => a.name.toLowerCase().includes(q)) : byCategory;
  }, [activeCategory, search]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search animations…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#f5f5f5] transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {animationCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              activeCategory === cat
                ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/40"
                : "bg-[#111111] text-[#888888] border-[#222222] hover:text-[#f5f5f5] hover:border-[#333333]"
            }`}
          >
            {cat}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeCategory === cat
                  ? "bg-[#a855f7]/30 text-[#a855f7]"
                  : "bg-[#1a1a1a] text-[#666666]"
              }`}
            >
              {categoryCounts[cat] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Animations grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((anim) => (
            <AnimationCard
              key={anim.id}
              animation={anim}
              onPreview={() => setPreviewAnimation(anim)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          No animations match &quot;{search}&quot;
        </div>
      )}

      {/* Preview modal */}
      <AnimationModal
        animation={previewAnimation}
        onClose={() => setPreviewAnimation(null)}
      />
    </>
  );
}
