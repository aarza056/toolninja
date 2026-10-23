import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import NdjsonFormatterClient from "./NdjsonFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ndjson-formatter");

export default function NdjsonFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="ndjson-formatter" />
      <NdjsonFormatterClient />
      <ToolSeoSection slug="ndjson-formatter" />
    </>
  );
}
