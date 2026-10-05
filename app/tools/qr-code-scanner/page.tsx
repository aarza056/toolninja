import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import QrCodeScannerClient from "./QrCodeScannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("qr-code-scanner");

export default function QrCodeScannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("qr-code-scanner")) }}
      />
      <QrCodeScannerClient />
      <ToolSeoSection slug="qr-code-scanner" />
    </>
  );
}
