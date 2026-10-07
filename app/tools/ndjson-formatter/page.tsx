import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import NdjsonFormatterClient from "./NdjsonFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ndjson-formatter");

export default function NdjsonFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("ndjson-formatter")) }}
      />
      <NdjsonFormatterClient />
      <ToolSeoSection slug="ndjson-formatter" />
    </>
  );
}
