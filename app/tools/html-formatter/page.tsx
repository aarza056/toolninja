import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HtmlFormatterClient from "./HtmlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("html-formatter");

export default function HtmlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("html-formatter")) }}
      />
      <HtmlFormatterClient />
      <ToolSeoSection slug="html-formatter" />
    </>
  );
}
