import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { buildErrorIndex } from "@/lib/error-matcher";
import ExplainErrorClient from "./ExplainErrorClient";

export const metadata: Metadata = {
  title: "Explain This Error — Paste an Error, Get a Solution | ToolNinja",
  description:
    "Paste any error message and get matched to the closest ToolNinja developer guide and relevant tool. A simple error message lookup tool — no AI, no login required.",
  keywords: [
    "paste error get solution",
    "error message lookup tool",
    "developer error explainer",
    "explain this error",
    "error message search",
  ],
  openGraph: {
    title: "Explain This Error — ToolNinja",
    description: "Paste any error message and get matched to the closest developer guide.",
    url: "https://toolninja.io/explain-error",
  },
  alternates: { canonical: "https://toolninja.io/explain-error" },
};

export default function ExplainErrorPage() {
  const posts = getAllPosts();
  const articles = buildErrorIndex(posts);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Explain This Error",
            description: "Paste any error message and get matched to the closest developer guide.",
            url: "https://toolninja.io/explain-error",
            isPartOf: {
              "@type": "WebSite",
              name: "ToolNinja",
              url: "https://toolninja.io",
            },
          }),
        }}
      />
      <ExplainErrorClient articles={articles} />
    </>
  );
}
