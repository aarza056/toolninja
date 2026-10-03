import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JwkThumbprintClient from "./JwkThumbprintClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwk-thumbprint-calculator");

export default function JwkThumbprintPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jwk-thumbprint-calculator")) }}
      />
      <JwkThumbprintClient />
      <ToolSeoSection slug="jwk-thumbprint-calculator" />
    </>
  );
}
