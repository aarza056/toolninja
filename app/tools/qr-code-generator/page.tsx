import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import QrCodeGeneratorClient from "./QrCodeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("qr-code-generator");

export default function QrCodeGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="qr-code-generator" />
      <QrCodeGeneratorClient />
      <ToolSeoSection slug="qr-code-generator" />
    </>
  );
}
