import type { BlogPostMeta } from "./blog";

export interface ErrorArticleIndex {
  slug: string;
  title: string;
  toolSlug: string | null;
  keywords: string[];
}

export interface ErrorMatch {
  slug: string;
  title: string;
  toolSlug: string | null;
  score: number;
}

export function buildErrorIndex(posts: BlogPostMeta[]): ErrorArticleIndex[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    toolSlug: post.relatedTools[0] ?? null,
    keywords: post.tags,
  }));
}

export function matchError(input: string, articles: ErrorArticleIndex[]): ErrorMatch[] {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return [];
  const words = normalized.split(/\s+/).filter((w) => w.length > 3);

  const scored = articles.map((article) => {
    let score = 0;
    // Exact substring match on title = highest score
    if (normalized.includes(article.title.toLowerCase())) score += 100;
    // Keyword overlap
    article.keywords.forEach((kw) => {
      if (normalized.includes(kw.toLowerCase())) score += 10;
    });
    // Word overlap fallback
    words.forEach((word) => {
      if (article.title.toLowerCase().includes(word)) score += 2;
    });
    return { slug: article.slug, title: article.title, toolSlug: article.toolSlug, score };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
