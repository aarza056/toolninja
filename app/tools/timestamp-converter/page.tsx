import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import TimestampConverterClient from "./TimestampConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("timestamp-converter");

export default function TimestampConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("timestamp-converter")) }}
      />
      <TimestampConverterClient />
      <ToolSeoSection slug="timestamp-converter" />
    </>
  );
}
