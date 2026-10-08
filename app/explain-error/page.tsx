import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { buildErrorIndex } from "@/lib/error-matcher";
import ExplainErrorClient from "./ExplainErrorClient";
import { webPageGraph, jsonLdString } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Explain This Error: Paste an Error, Find a Fix",
  description:
    "Paste an error message to find the closest ToolNinja guide and tool for it. Simple keyword matching in your browser, no AI and no login.",
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
          __html: jsonLdString(
            webPageGraph({
              url: "https://toolninja.io/explain-error",
              name: "Explain This Error",
              description: "Paste any error message and get matched to the closest developer guide.",
              breadcrumb: [
                { name: "Home", url: "https://toolninja.io" },
                { name: "Explain This Error", url: "https://toolninja.io/explain-error" },
              ],
            })
          ),
        }}
      />
      <ExplainErrorClient articles={articles} />
    </>
  );
}
