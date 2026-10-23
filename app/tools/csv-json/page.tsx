import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CsvJsonClient from "./CsvJsonClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("csv-json");

export default function CsvJsonPage() {
  return (
    <>
      <ToolJsonLd slug="csv-json" />
      <CsvJsonClient />
      <ToolSeoSection slug="csv-json" />
    </>
  );
}
