import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssGridGeneratorClient from "./CssGridGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-grid-generator");

export default function CssGridGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-grid-generator")) }}
      />
      <CssGridGeneratorClient />
      <ToolSeoSection slug="css-grid-generator" />
    </>
  );
}
