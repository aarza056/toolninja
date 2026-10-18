import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonToZodClient from "./JsonToZodClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-zod");

export default function JsonToZodPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("json-to-zod")) }}
      />
      <JsonToZodClient />
      <ToolSeoSection slug="json-to-zod" />
    </>
  );
}
