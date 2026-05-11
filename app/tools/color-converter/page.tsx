import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ColorConverterClient from "./ColorConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-converter");

export default function ColorConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("color-converter")) }}
      />
      <ColorConverterClient />
      <ToolSeoSection slug="color-converter" />
    </>
  );
}
