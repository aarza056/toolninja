import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JwkPemConverterClient from "./JwkPemConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwk-pem-converter");

export default function JwkPemConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jwk-pem-converter")) }}
      />
      <JwkPemConverterClient />
      <ToolSeoSection slug="jwk-pem-converter" />
    </>
  );
}
