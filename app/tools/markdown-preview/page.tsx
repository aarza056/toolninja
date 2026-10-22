import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MarkdownPreviewClient from "./MarkdownPreviewClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-preview");

export default function MarkdownPreviewPage() {
  return (
    <>
      <ToolJsonLd slug="markdown-preview" />
      <MarkdownPreviewClient />
      <ToolSeoSection slug="markdown-preview" />
    </>
  );
}
