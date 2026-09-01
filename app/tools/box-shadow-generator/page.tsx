import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import BoxShadowGeneratorClient from "./BoxShadowGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("box-shadow-generator");

export default function BoxShadowGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("box-shadow-generator")) }}
      />
      <BoxShadowGeneratorClient />
      <ToolSeoSection slug="box-shadow-generator" />
    </>
  );
}
