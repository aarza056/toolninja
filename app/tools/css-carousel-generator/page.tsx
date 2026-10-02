import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssCarouselGeneratorClient from "./CssCarouselGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-carousel-generator");

export default function CssCarouselGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-carousel-generator")) }}
      />
      <CssCarouselGeneratorClient />
      <ToolSeoSection slug="css-carousel-generator" />
    </>
  );
}
