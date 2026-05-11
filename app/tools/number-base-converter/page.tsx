import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import NumberBaseConverterClient from "./NumberBaseConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("number-base-converter");

export default function NumberBaseConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("number-base-converter")) }}
      />
      <NumberBaseConverterClient />
      <ToolSeoSection slug="number-base-converter" />
    </>
  );
}
