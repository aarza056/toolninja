import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Developer Guides & Tutorials",
  description:
    "In-depth guides for developers: chmod, CIDR, JWT, regex, Base64, UUIDs, Git, JSON, timestamps, and more. Practical references with real-world examples.",
  openGraph: {
    title: "ToolNinja Blog — Developer Guides",
    description: "Practical guides for every tool in your developer toolkit.",
    url: "https://toolninja.io/blog",
  },
  alternates: { canonical: "https://toolninja.io/blog" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "ToolNinja Blog",
            description: "Developer guides and tutorials from ToolNinja",
            url: "https://toolninja.io/blog",
            publisher: {
              "@type": "Organization",
              name: "ToolNinja",
              url: "https://toolninja.io",
            },
          }),
        }}
      />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-[#555555] mb-3">
          <Link href="/" className="hover:text-[#888888] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#f5f5f5]">Blog</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-3">
          Developer Guides
        </h1>
        <p className="text-[#888888] text-base leading-relaxed">
          Practical references for tools developers use every day — Linux
          permissions, networking, authentication, and more.
        </p>
      </div>

      {/* Post list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block p-5 bg-[#111111] border border-[#222222] rounded-xl hover:border-[#a855f7]/40 hover:bg-[#111111]/80 transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0 mt-0.5">
                {post.coverEmoji}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors mb-1 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-[#666666] leading-relaxed mb-3 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#444444]">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {post.readingTime} min read
                  </span>
                  <div className="flex gap-1.5 ml-auto">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#555555] text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="flex-shrink-0 text-[#333333] group-hover:text-[#a855f7] transition-colors mt-1"
              />
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-[#555555]">
          No posts yet. Check back soon.
        </div>
      )}
    </div>
  );
}
