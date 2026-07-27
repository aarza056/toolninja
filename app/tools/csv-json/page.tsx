import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CsvJsonClient from "./CsvJsonClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("csv-json");

export default function CsvJsonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("csv-json")) }}
      />
      <CsvJsonClient />
      <ToolSeoSection slug="csv-json" />
    </>
  );
}
