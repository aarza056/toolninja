import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonDiffClient from "./JsonDiffClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-diff");

export default function JsonDiffPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-diff")) }}
      />
      <JsonDiffClient />
      <ToolSeoSection slug="json-diff" />
    </>
  );
}
