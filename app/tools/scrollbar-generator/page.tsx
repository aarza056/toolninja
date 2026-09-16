import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ScrollbarGeneratorClient from "./ScrollbarGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("scrollbar-generator");

export default function ScrollbarGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("scrollbar-generator")) }}
      />
      <ScrollbarGeneratorClient />
      <ToolSeoSection slug="scrollbar-generator" />
    </>
  );
}
