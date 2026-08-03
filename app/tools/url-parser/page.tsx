import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UrlParserClient from "./UrlParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("url-parser");

export default function UrlParserPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("url-parser")) }}
      />
      <UrlParserClient />
      <ToolSeoSection slug="url-parser" />
    </>
  );
}
