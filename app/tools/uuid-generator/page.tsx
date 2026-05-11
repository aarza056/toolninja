import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UuidGeneratorClient from "./UuidGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("uuid-generator");

export default function UuidGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("uuid-generator")) }}
      />
      <UuidGeneratorClient />
      <ToolSeoSection slug="uuid-generator" />
    </>
  );
}
