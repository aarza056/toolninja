import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHORS } from "@/lib/authors";
import { getAllPosts } from "@/lib/blog";
import { graph, breadcrumbNode, jsonLdString, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/structured-data";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((id) => ({ id }));
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max - 1)) + "…";
}

export function generateMetadata({ params }: Props): Metadata {
  const author = AUTHORS[params.id];
  if (!author) return {};
  const url = `https://toolninja.io/authors/${author.id}`;
  return {
    title: `${author.name}: Author Profile`,
    description: clip(author.bio, 155),
    alternates: { canonical: url },
    openGraph: { title: `${author.name} | ToolNinja`, description: clip(author.bio, 155), url, type: "profile" },
  };
}

export default function AuthorPage({ params }: Props) {
  const author = AUTHORS[params.id];
  if (!author) notFound();

  const url = `https://toolninja.io/authors/${author.id}`;
  const posts = getAllPosts().filter((p) => p.author === author.id);
  const links = [...(author.url ? [author.url] : []), ...(author.sameAs ?? [])];

  const entity =
    author.type === "Organization" && author.id === "toolninja"
      ? { "@id": ORGANIZATION_ID }
      : { "@type": author.type, name: author.name, description: author.bio, ...(links.length ? { sameAs: links } : {}) };

  const jsonLd = graph(
    {
      "@type": "ProfilePage",
      "@id": `${url}#profile`,
      url,
      name: `${author.name} on ToolNinja`,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: entity,
    },
    breadcrumbNode([
      { name: "Home", url: "https://toolninja.io" },
      { name: "Blog", url: "https://toolninja.io/blog" },
      { name: author.name, url },
    ])
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#888888] mb-8">
        <Link href="/" className="hover:text-[#f5f5f5] transition-colors">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/blog" className="hover:text-[#f5f5f5] transition-colors">Blog</Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#aaaaaa]">{author.name}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-1">{author.name}</h1>
        {author.role && <p className="text-sm text-[#aaaaaa] mb-4">{author.role}</p>}
        <p className="text-[15px] text-[#aaaaaa] leading-relaxed">{author.bio}</p>
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-4 mt-4 text-sm">
            {links.map((href) => (
              <li key={href}>
                <a href={href} rel="me noopener noreferrer" target="_blank" className="text-[#c084fc] hover:underline">
                  {href.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <h2 className="text-sm font-semibold text-[#f5f5f5] mb-4">Guides by {author.name} ({posts.length})</h2>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="text-sm text-[#aaaaaa] hover:text-[#c084fc] transition-colors">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
