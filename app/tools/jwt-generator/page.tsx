import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JwtGeneratorClient from "./JwtGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-generator");

export default function JwtGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jwt-generator")) }}
      />
      <JwtGeneratorClient />
      <ToolSeoSection slug="jwt-generator" />
    </>
  );
}
