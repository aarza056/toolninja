import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonToMarkdownTableClient from "./JsonToMarkdownTableClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-markdown-table");

export default function JsonToMarkdownTablePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-to-markdown-table")) }}
      />
      <JsonToMarkdownTableClient />
      <ToolSeoSection slug="json-to-markdown-table" />
    </>
  );
}
