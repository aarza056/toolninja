import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonSchemaGeneratorClient from "./JsonSchemaGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-schema-generator");

export default function JsonSchemaGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-schema-generator")) }}
      />
      <JsonSchemaGeneratorClient />
      <ToolSeoSection slug="json-schema-generator" />
    </>
  );
}
