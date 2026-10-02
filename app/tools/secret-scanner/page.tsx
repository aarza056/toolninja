import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SecretScannerClient from "./SecretScannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("secret-scanner");

export default function SecretScannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("secret-scanner")) }}
      />
      <SecretScannerClient />
      <ToolSeoSection slug="secret-scanner" />
    </>
  );
}
