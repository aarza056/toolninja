import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import QrCodeScannerClient from "./QrCodeScannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("qr-code-scanner");

export default function QrCodeScannerPage() {
  return (
    <>
      <ToolJsonLd slug="qr-code-scanner" />
      <QrCodeScannerClient />
      <ToolSeoSection slug="qr-code-scanner" />
    </>
  );
}
