import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssXpathConverterClient from "./CssXpathConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-xpath-converter");

export default function CssXpathConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-xpath-converter")) }}
      />
      <CssXpathConverterClient />
      <ToolSeoSection slug="css-xpath-converter" />
    </>
  );
}
