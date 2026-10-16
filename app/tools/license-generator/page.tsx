import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import LicenseGeneratorClient from "./LicenseGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("license-generator");

export default function LicenseGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("license-generator")) }}
      />
      <LicenseGeneratorClient />
      <ToolSeoSection slug="license-generator" />
    </>
  );
}
