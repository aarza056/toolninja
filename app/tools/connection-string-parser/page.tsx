import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ConnectionStringParserClient from "./ConnectionStringParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("connection-string-parser");

export default function ConnectionStringParserPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("connection-string-parser")) }}
      />
      <ConnectionStringParserClient />
      <ToolSeoSection slug="connection-string-parser" />
    </>
  );
}
