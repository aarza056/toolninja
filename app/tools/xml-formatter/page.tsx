import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import XmlFormatterClient from "./XmlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xml-formatter");

export default function XmlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("xml-formatter")) }}
      />
      <XmlFormatterClient />
      <ToolSeoSection slug="xml-formatter" />
    </>
  );
}
