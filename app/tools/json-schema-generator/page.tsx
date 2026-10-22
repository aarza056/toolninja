import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonSchemaGeneratorClient from "./JsonSchemaGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-schema-generator");

export default function JsonSchemaGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="json-schema-generator" />
      <JsonSchemaGeneratorClient />
      <ToolSeoSection slug="json-schema-generator" />
    </>
  );
}
