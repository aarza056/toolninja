// JSON-LD builders. Every schema.org object the site emits is built here from existing data
// (tools, tool content, blog frontmatter, authors) so no page hand-writes its own markup.
// Each page emits a single <script type="application/ld+json"> holding an @graph; nodes refer
// to the site-wide WebSite and Organization by @id instead of repeating them.

import { SITE_NAME, SITE_URL } from "./site";
import { tools } from "./tools";
import { toolContent } from "./tool-content";
import { getAuthor } from "./authors";
import type { BlogPostMeta } from "./blog";

export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

type Node = Record<string, unknown>;

export function graph(...nodes: (Node | null | undefined)[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((n): n is Node => Boolean(n)),
  };
}

export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon-192.png`,
      width: 192,
      height: 192,
    },
  };
}

export function websiteNode(description: string): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function breadcrumbNode(items: { name: string; url: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqNode(faqs: { q: string; a: string }[] | undefined): Node | null {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function toolGraph(slug: string, description: string) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return null;
  const url = `${SITE_URL}/tools/${slug}`;
  return graph(
    {
      "@type": "SoftwareApplication",
      "@id": `${url}#app`,
      name: tool.name,
      url,
      description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and a modern web browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": ORGANIZATION_ID },
      isPartOf: { "@id": WEBSITE_ID },
    },
    breadcrumbNode([
      { name: "Home", url: SITE_URL },
      { name: tool.name, url },
    ]),
    faqNode(toolContent[slug]?.faq)
  );
}

export function blogPostGraph(post: BlogPostMeta) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const author = getAuthor(post.author);
  const authorNode =
    author.type === "Organization" && author.id === "toolninja"
      ? { "@id": ORGANIZATION_ID }
      : {
          "@type": author.type,
          name: author.name,
          url: `${SITE_URL}/authors/${author.id}`,
          ...(author.sameAs?.length ? { sameAs: author.sameAs } : {}),
        };
  return graph(
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.description,
      url,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      author: authorNode,
      publisher: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: url,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
      keywords: post.tags.join(", "),
    },
    breadcrumbNode([
      { name: "Home", url: SITE_URL },
      { name: "Blog", url: `${SITE_URL}/blog` },
      { name: post.title, url },
    ]),
    faqNode(post.faqs)
  );
}

export function webPageGraph(opts: { url: string; name: string; description: string; breadcrumb?: { name: string; url: string }[] }) {
  return graph(
    {
      "@type": "WebPage",
      "@id": `${opts.url}#webpage`,
      url: opts.url,
      name: opts.name,
      description: opts.description,
      isPartOf: { "@id": WEBSITE_ID },
    },
    opts.breadcrumb ? breadcrumbNode(opts.breadcrumb) : null
  );
}

/** Serializes JSON-LD for a <script> tag, escaping "<" so content can't close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
