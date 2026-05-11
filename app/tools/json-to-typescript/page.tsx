import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonToTypeScriptClient from "./JsonToTypeScriptClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-typescript");

export default function JsonToTypeScriptPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-to-typescript")) }}
      />
      <JsonToTypeScriptClient />
      <ToolSeoSection slug="json-to-typescript" />
    </>
  );
}
