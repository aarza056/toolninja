import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ReadmeBadgeGeneratorClient from "./ReadmeBadgeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("readme-badge-generator");

export default function ReadmeBadgeGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("readme-badge-generator")) }}
      />
      <ReadmeBadgeGeneratorClient />
      <ToolSeoSection slug="readme-badge-generator" />
    </>
  );
}
