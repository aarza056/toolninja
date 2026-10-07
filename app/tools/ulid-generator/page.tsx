import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UlidGeneratorClient from "./UlidGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ulid-generator");

export default function UlidGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("ulid-generator")) }}
      />
      <UlidGeneratorClient />
      <ToolSeoSection slug="ulid-generator" />
    </>
  );
}
