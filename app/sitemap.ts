import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { CATEGORY_INFO } from "@/lib/categories";
import { COMMON_MODES } from "@/lib/chmod-modes";
import { CURL_LANGUAGE_PAGES } from "@/lib/curl-languages";
import { FLAVORS } from "@/lib/regex-flavors";
import { BARCODE_PAGES } from "@/lib/barcode-pages";
import { TOKEN_COUNTER_PAGES } from "@/lib/token-counter-pages";

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
    // Reference pages: one per CIDR prefix and per common chmod mode
    ...Array.from({ length: 33 }, (_, p) => ({ url: `${BASE_URL}/tools/cidr-calculator/${p}`, changeFrequency: "yearly" as const, priority: 0.6 })),
    ...COMMON_MODES.map((m) => ({ url: `${BASE_URL}/tools/chmod-calculator/${m}`, changeFrequency: "yearly" as const, priority: 0.6 })),
    // One page per target language / regex flavor / barcode type / AI provider
    ...CURL_LANGUAGE_PAGES.map((p) => ({ url: `${BASE_URL}/tools/curl-to-code/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...FLAVORS.map((f) => ({ url: `${BASE_URL}/tools/regex-tester/${f.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...BARCODE_PAGES.map((p) => ({ url: `${BASE_URL}/tools/barcode-generator/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...Object.keys(TOKEN_COUNTER_PAGES).map((p) => ({ url: `${BASE_URL}/tools/ai-token-counter/${p}`, changeFrequency: "monthly" as const, priority: 0.6 })),
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
    { url: `${BASE_URL}/videos`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/changelog`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
