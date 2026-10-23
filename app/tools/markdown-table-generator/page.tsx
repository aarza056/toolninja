import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MarkdownTableGeneratorClient from "./MarkdownTableGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-table-generator");

export default function MarkdownTableGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="markdown-table-generator" />
      <MarkdownTableGeneratorClient />
      <ToolSeoSection slug="markdown-table-generator" />
    </>
  );
}
