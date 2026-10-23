import type { MetadataRoute } from "next";

// Every group repeats the disallow: a crawler with its own group ignores the "*" group.
const PRIVATE = ["/admin", "/api/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: PRIVATE,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: "https://toolninja.io/sitemap.xml",
    host: "https://toolninja.io",
  };
}
