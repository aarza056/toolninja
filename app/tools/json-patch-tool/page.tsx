import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonPatchToolClient from "./JsonPatchToolClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-patch-tool");

export default function JsonPatchToolPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-patch-tool")) }}
      />
      <JsonPatchToolClient />
      <ToolSeoSection slug="json-patch-tool" />
    </>
  );
}
