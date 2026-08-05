import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import TotpGeneratorClient from "./TotpGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("totp-generator");

export default function TotpGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("totp-generator")) }}
      />
      <TotpGeneratorClient />
      <ToolSeoSection slug="totp-generator" />
    </>
  );
}
