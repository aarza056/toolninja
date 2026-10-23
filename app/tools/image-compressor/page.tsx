import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ImageCompressorClient from "./ImageCompressorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-compressor");

export default function ImageCompressorPage() {
  return (
    <>
      <ToolJsonLd slug="image-compressor" />
      <ImageCompressorClient />
      <ToolSeoSection slug="image-compressor" />
    </>
  );
}
