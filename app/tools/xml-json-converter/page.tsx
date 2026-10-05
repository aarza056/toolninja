import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import XmlJsonConverterClient from "./XmlJsonConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xml-json-converter");

export default function XmlJsonConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("xml-json-converter")) }}
      />
      <XmlJsonConverterClient />
      <ToolSeoSection slug="xml-json-converter" />
    </>
  );
}
