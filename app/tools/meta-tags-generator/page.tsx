import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MetaTagsGeneratorClient from "./MetaTagsGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("meta-tags-generator");

export default function MetaTagsGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("meta-tags-generator")) }}
      />
      <MetaTagsGeneratorClient />
      <ToolSeoSection slug="meta-tags-generator" />
    </>
  );
}
