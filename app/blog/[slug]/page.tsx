import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllPostSlugs, getAllPosts } from "@/lib/blog";
import { Calendar, Clock, Tag } from "lucide-react";
import { tools } from "@/lib/tools";
import BlogContent from "./BlogContent";
import ShareButtons from "@/components/ShareButtons";
import RelatedArticles from "@/components/RelatedArticles";
import AdSlot from "@/components/AdSlot";
import { AD_SLOTS } from "@/lib/ads";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

function ogImagePath(title: string, description: string): string {
  return `/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  const ogImage = ogImagePath(post.title, post.description);

  return {
    // Error-message titles are already long; the "| ToolNinja" suffix would only push the
    // part that matches the searcher's query further toward truncation.
    title: post.title.length > 50 ? { absolute: post.title } : post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author, url: "https://toolninja.io" }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://toolninja.io/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["ToolNinja"],
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: { canonical: `https://toolninja.io/blog/${post.slug}` },
  };
}

// Splits markdown at the "## " heading closest to the midpoint by character count, so
// the ad lands roughly mid-article at a natural section boundary rather than mid-sentence.
function splitAtMidpoint(content: string): [string, string | null] {
  const indices: number[] = [];
  const headingRegex = /\n(?=## )/g;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content))) {
    indices.push(match.index + 1);
  }
  if (indices.length < 2) return [content, null];

  const target = content.length / 2;
  let best = indices[0];
  let bestDist = Math.abs(best - target);
  for (const idx of indices) {
    const dist = Math.abs(idx - target);
    if (dist < bestDist) {
      best = idx;
      bestDist = dist;
    }
  }
  return [content.slice(0, best), content.slice(best)];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();

  const [contentBefore, contentAfter] = splitAtMidpoint(post.content);

  const relatedToolObjects = post.relatedTools
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `https://toolninja.io${ogImagePath(post.title, post.description)}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "ToolNinja",
      url: "https://toolninja.io",
    },
    publisher: {
      "@type": "Organization",
      name: "ToolNinja",
      url: "https://toolninja.io",
      logo: { "@type": "ImageObject", url: "https://toolninja.io/logo.png" },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://toolninja.io/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://toolninja.io" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://toolninja.io/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://toolninja.io/blog/${post.slug}`,
      },
    ],
  };

  const faqSchema =
    post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }
      : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#555555] mb-8">
        <Link href="/" className="hover:text-[#888888] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#888888] transition-colors">
          Blog
        </Link>
        <span>/</span>
        <span className="text-[#888888] truncate">{post.title}</span>
      </div>

      {/* Article header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{post.coverEmoji}</span>
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 rounded-full"
              >
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] leading-tight mb-3">
          {post.title}
        </h1>
        <p className="text-[#888888] text-base leading-relaxed mb-4">
          {post.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-[#555555] border-t border-[#1e1e1e] pt-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {post.readingTime} min read
          </span>
          <span className="text-[#333333]">by {post.author}</span>
        </div>
      </header>

      {/* 1. Article content */}
      <BlogContent content={contentBefore} />
      {contentAfter && (
        <>
          <AdSlot slot={AD_SLOTS.blogMidArticle} layout="in-article" className="my-8" />
          <BlogContent content={contentAfter} />
        </>
      )}

      {/* 2. Share buttons */}
      <ShareButtons
        title={post.title}
        url={`https://toolninja.io/blog/${post.slug}`}
      />

      {/* 3. FAQ section */}
      {post.faqs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#f5f5f5] mb-5 pb-2 border-b border-[#1e1e1e]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {post.faqs.map((faq, i) => (
              <div
                key={i}
                className="p-4 bg-[#111111] border border-[#1e1e1e] rounded-lg"
              >
                <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-[#888888] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Related articles */}
      <RelatedArticles
        currentSlug={post.slug}
        currentTags={post.tags}
        allPosts={allPosts}
      />

      {/* 5. Tool CTA */}
      {relatedToolObjects.length > 0 && (
        <div className="mt-8 p-5 bg-[#111111] border border-[#a855f7]/20 rounded-xl">
          <h2 className="text-sm font-semibold text-[#f5f5f5] mb-3">
            Try it yourself →
          </h2>
          <div className="flex flex-col gap-2">
            {relatedToolObjects.map((tool) => (
              <Link
                key={tool!.slug}
                href={`/tools/${tool!.slug}`}
                className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#222222] rounded-lg hover:border-[#a855f7]/40 transition-colors group"
              >
                <span className="text-[#a855f7] font-mono text-xs bg-[#a855f7]/10 px-2 py-0.5 rounded">
                  tool
                </span>
                <span className="text-sm text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors font-medium">
                  {tool!.name}
                </span>
                <span className="text-xs text-[#555555] ml-auto">
                  Free, browser-only →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 6. Back to blog */}
      <div className="mt-8 pt-6 border-t border-[#1e1e1e]">
        <Link
          href="/blog"
          className="text-sm text-[#555555] hover:text-[#a855f7] transition-colors"
        >
          ← All articles
        </Link>
      </div>
    </div>
  );
}
