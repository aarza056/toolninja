import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PatchGeneratorClient from "./PatchGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("patch-generator");

export default function PatchGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("patch-generator")) }}
      />
      <PatchGeneratorClient />
      <ToolSeoSection slug="patch-generator" />
    </>
  );
}
