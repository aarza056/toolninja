import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonYamlClient from "./JsonYamlClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-yaml");

export default function JsonYamlPage() {
  return (
    <>
      <ToolJsonLd slug="json-yaml" />
      <JsonYamlClient />
      <ToolSeoSection slug="json-yaml" />
    </>
  );
}
