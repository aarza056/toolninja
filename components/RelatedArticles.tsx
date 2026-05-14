import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog";

interface RelatedArticlesProps {
  currentSlug: string;
  currentTags: string[];
  allPosts: BlogPostMeta[];
}

export default function RelatedArticles({
  currentSlug,
  currentTags,
  allPosts,
}: RelatedArticlesProps) {
  const related = allPosts
    .filter((p) => p.slug !== currentSlug)
    .filter((p) => p.tags.some((tag) => currentTags.includes(tag)))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-[#1e1e1e]">
      <h2 className="text-sm font-semibold text-[#f5f5f5] mb-4">
        Related Articles
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="block bg-[#111111] border border-[#222222] rounded-lg p-4 hover:border-[#a855f7]/50 transition-colors group"
          >
            <span className="text-2xl mb-2 block">{article.coverEmoji}</span>
            <h3 className="text-xs font-medium text-[#e5e5e5] mb-1 leading-snug group-hover:text-[#a855f7] transition-colors">
              {article.title}
            </h3>
            <p className="text-[10px] text-[#555555]">
              {article.readingTime} min read
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
