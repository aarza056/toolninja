import type { Metadata } from "next";
import { tools } from "./tools";

const BASE_URL = "https://toolninja.io";

export function generateToolMetadata(slug: string): Metadata {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return {};

  const title = `${tool.name} Online — Free Developer Tool | ToolNinja`;
  const description = `${tool.description}. Free, online, no login required. Your data never leaves your browser.`;
  const url = `${BASE_URL}/tools/${slug}`;
  const ogImage = `/api/og?title=${encodeURIComponent(tool.name)}&desc=${encodeURIComponent(tool.description)}`;

  return {
    title,
    description,
    keywords: [
      ...tool.keywords,
      "free online tool",
      "developer tools",
      "browser tool",
      "no login",
      "toolninja",
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: "ToolNinja",
      images: [{ url: ogImage, width: 1200, height: 630, alt: tool.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateToolJsonLd(slug: string) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: `${BASE_URL}/tools/${slug}`,
    description: `${tool.description}. Free, online, no login required.`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "ToolNinja",
      url: BASE_URL,
    },
  };
}
