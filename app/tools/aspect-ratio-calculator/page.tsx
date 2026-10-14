import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import AspectRatioCalculatorClient from "./AspectRatioCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("aspect-ratio-calculator");

export default function AspectRatioCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("aspect-ratio-calculator")) }}
      />
      <AspectRatioCalculatorClient />
      <ToolSeoSection slug="aspect-ratio-calculator" />
    </>
  );
}
