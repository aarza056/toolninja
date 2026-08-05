import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import BarcodeGeneratorClient from "./BarcodeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("barcode-generator");

export default function BarcodeGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("barcode-generator")) }}
      />
      <BarcodeGeneratorClient />
      <ToolSeoSection slug="barcode-generator" />
    </>
  );
}
