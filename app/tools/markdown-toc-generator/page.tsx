import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MarkdownTocGeneratorClient from "./MarkdownTocGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-toc-generator");

export default function MarkdownTocGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("markdown-toc-generator")) }}
      />
      <MarkdownTocGeneratorClient />
      <ToolSeoSection slug="markdown-toc-generator" />
    </>
  );
}
