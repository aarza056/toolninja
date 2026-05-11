import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import QrCodeGeneratorClient from "./QrCodeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("qr-code-generator");

export default function QrCodeGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("qr-code-generator")) }}
      />
      <QrCodeGeneratorClient />
      <ToolSeoSection slug="qr-code-generator" />
    </>
  );
}
