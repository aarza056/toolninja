import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HashGeneratorClient from "./HashGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("hash-generator");

export default function HashGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("hash-generator")) }}
      />
      <HashGeneratorClient />
      <ToolSeoSection slug="hash-generator" />
    </>
  );
}
