import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UuidParserClient from "./UuidParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("uuid-parser");

export default function UuidParserPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("uuid-parser")) }}
      />
      <UuidParserClient />
      <ToolSeoSection slug="uuid-parser" />
    </>
  );
}
