import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HotpGeneratorClient from "./HotpGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("hotp-generator");

export default function HotpGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("hotp-generator")) }}
      />
      <HotpGeneratorClient />
      <ToolSeoSection slug="hotp-generator" />
    </>
  );
}
