import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SitemapGeneratorClient from "./SitemapGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("sitemap-generator");

export default function SitemapGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="sitemap-generator" />
      <SitemapGeneratorClient />
      <ToolSeoSection slug="sitemap-generator" />
    </>
  );
}
