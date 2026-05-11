import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import StringCaseConverterClient from "./StringCaseConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("string-case-converter");

export default function StringCaseConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("string-case-converter")) }}
      />
      <StringCaseConverterClient />
      <ToolSeoSection slug="string-case-converter" />
    </>
  );
}
