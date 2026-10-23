import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonToMarkdownTableClient from "./JsonToMarkdownTableClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-markdown-table");

export default function JsonToMarkdownTablePage() {
  return (
    <>
      <ToolJsonLd slug="json-to-markdown-table" />
      <JsonToMarkdownTableClient />
      <ToolSeoSection slug="json-to-markdown-table" />
    </>
  );
}
