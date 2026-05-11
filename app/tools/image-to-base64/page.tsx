import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ImageToBase64Client from "./ImageToBase64Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-to-base64");

export default function ImageToBase64Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("image-to-base64")) }}
      />
      <ImageToBase64Client />
      <ToolSeoSection slug="image-to-base64" />
    </>
  );
}
