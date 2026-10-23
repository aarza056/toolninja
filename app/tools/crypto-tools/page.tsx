import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CryptoToolsClient from "./CryptoToolsClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("crypto-tools");

export default function CryptoToolsPage() {
  return (
    <>
      <ToolJsonLd slug="crypto-tools" />
      <CryptoToolsClient />
      <ToolSeoSection slug="crypto-tools" />
    </>
  );
}
