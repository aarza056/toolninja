import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CryptoToolsClient from "./CryptoToolsClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("crypto-tools");

export default function CryptoToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("crypto-tools")) }}
      />
      <CryptoToolsClient />
      <ToolSeoSection slug="crypto-tools" />
    </>
  );
}
