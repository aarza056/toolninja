import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonFormatterClient from "./JsonFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-formatter");

export default function JsonFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-formatter")) }}
      />
      <JsonFormatterClient />
      <ToolSeoSection slug="json-formatter" />
    </>
  );
}
