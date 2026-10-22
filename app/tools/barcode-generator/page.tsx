import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import BarcodeGeneratorClient from "./BarcodeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("barcode-generator");

export default function BarcodeGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="barcode-generator" />
      <BarcodeGeneratorClient />
      <ToolSeoSection slug="barcode-generator" />
    </>
  );
}
