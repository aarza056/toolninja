import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MarkdownTableGeneratorClient from "./MarkdownTableGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-table-generator");

export default function MarkdownTableGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("markdown-table-generator")) }}
      />
      <MarkdownTableGeneratorClient />
      <ToolSeoSection slug="markdown-table-generator" />
    </>
  );
}
