import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SlugGeneratorClient from "./SlugGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("slug-generator");

export default function SlugGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("slug-generator")) }}
      />
      <SlugGeneratorClient />
      <ToolSeoSection slug="slug-generator" />
    </>
  );
}
