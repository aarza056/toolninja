import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SitemapGeneratorClient from "./SitemapGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("sitemap-generator");

export default function SitemapGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("sitemap-generator")) }}
      />
      <SitemapGeneratorClient />
      <ToolSeoSection slug="sitemap-generator" />
    </>
  );
}
