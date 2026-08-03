import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ImageCompressorClient from "./ImageCompressorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-compressor");

export default function ImageCompressorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("image-compressor")) }}
      />
      <ImageCompressorClient />
      <ToolSeoSection slug="image-compressor" />
    </>
  );
}
