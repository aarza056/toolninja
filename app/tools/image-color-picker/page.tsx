import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ImageColorPickerClient from "./ImageColorPickerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-color-picker");

export default function ImageColorPickerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("image-color-picker")) }}
      />
      <ImageColorPickerClient />
      <ToolSeoSection slug="image-color-picker" />
    </>
  );
}
