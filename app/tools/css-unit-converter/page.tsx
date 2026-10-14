import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssUnitConverterClient from "./CssUnitConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-unit-converter");

export default function CssUnitConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-unit-converter")) }}
      />
      <CssUnitConverterClient />
      <ToolSeoSection slug="css-unit-converter" />
    </>
  );
}
