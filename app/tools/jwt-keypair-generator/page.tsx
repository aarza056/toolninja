import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JwtKeypairGeneratorClient from "./JwtKeypairGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-keypair-generator");

export default function JwtKeypairGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jwt-keypair-generator")) }}
      />
      <JwtKeypairGeneratorClient />
      <ToolSeoSection slug="jwt-keypair-generator" />
    </>
  );
}
