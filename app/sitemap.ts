import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { CATEGORY_INFO } from "@/lib/categories";

const BASE_URL = "https://toolninja.io";

// lastModified is only set where we know a real date (blog posts). Stamping every page with the
// build time on each deploy teaches Google to ignore lastmod for the whole site.
export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = getAllPosts();
  const latestPost = blogPosts[0]?.date;

  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/ask`, changeFrequency: "weekly", priority: 0.9 },
    ...CATEGORY_INFO.map((c) => ({
      url: `${BASE_URL}/tools/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...tools.map((tool) => ({
      url: `${BASE_URL}/tools/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/blog`,
      ...(latestPost ? { lastModified: new Date(latestPost) } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE_URL}/explain-error`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/changelog`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
