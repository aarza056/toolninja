import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MarkdownTocGeneratorClient from "./MarkdownTocGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("markdown-toc-generator");

export default function MarkdownTocGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="markdown-toc-generator" />
      <MarkdownTocGeneratorClient />
      <ToolSeoSection slug="markdown-toc-generator" />
    </>
  );
}
