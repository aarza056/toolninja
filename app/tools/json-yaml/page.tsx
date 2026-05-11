import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonYamlClient from "./JsonYamlClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-yaml");

export default function JsonYamlPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-yaml")) }}
      />
      <JsonYamlClient />
      <ToolSeoSection slug="json-yaml" />
    </>
  );
}
