import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MarkdownPreviewClient from "./MarkdownPreviewClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-preview");

export default function MarkdownPreviewPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("markdown-preview")) }}
      />
      <MarkdownPreviewClient />
      <ToolSeoSection slug="markdown-preview" />
    </>
  );
}
