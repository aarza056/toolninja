import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DEFAULT_AUTHOR_ID } from "./authors";
import { getToolsForPost } from "./blog-tool-map";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface FAQ {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Last substantive update (YYYY-MM-DD). Falls back to `date`. */
  updated?: string;
  /** Author id from lib/authors.ts. */
  author: string;
  /** Optional shorter <title> when the H1 is too long for search results (≤ 48 chars). */
  metaTitle?: string;
  /** Optional search description when `description` is longer than 155 chars. */
  metaDescription?: string;
  tags: string[];
  readingTime: number;
  content: string;
  relatedTools: string[];
  coverEmoji?: string;
  faqs: FAQ[];
}

export type BlogPostMeta = Omit<BlogPost, "content">;

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    updated: data.updated ?? undefined,
    author: String(data.author ?? DEFAULT_AUTHOR_ID).toLowerCase(),
    metaTitle: data.metaTitle ?? undefined,
    metaDescription: data.metaDescription ?? undefined,
    tags: data.tags ?? [],
    readingTime: estimateReadingTime(content),
    content,
    relatedTools: getToolsForPost(slug),
    coverEmoji: data.coverEmoji ?? "🥷",
    faqs: data.faqs ?? [],
  };
}

export function getAllPosts(): BlogPostMeta[] {
  return getAllPostSlugs()
    .map((slug) => {
      const post = getPostBySlug(slug);
      if (!post) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _content, ...meta } = post;
      return meta;
    })
    .filter((p): p is BlogPostMeta => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
