import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PlaceholderImageGeneratorClient from "./PlaceholderImageGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("placeholder-image-generator");

export default function PlaceholderImageGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("placeholder-image-generator")) }}
      />
      <PlaceholderImageGeneratorClient />
      <ToolSeoSection slug="placeholder-image-generator" />
    </>
  );
}
