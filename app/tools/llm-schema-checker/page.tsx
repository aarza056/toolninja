import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import LlmSchemaCheckerClient from "./LlmSchemaCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("llm-schema-checker");

export default function LlmSchemaCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="llm-schema-checker" />
      <LlmSchemaCheckerClient />
      <ToolSeoSection slug="llm-schema-checker" />
    </>
  );
}
