import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SecretScannerClient from "./SecretScannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("secret-scanner");

export default function SecretScannerPage() {
  return (
    <>
      <ToolJsonLd slug="secret-scanner" />
      <SecretScannerClient />
      <ToolSeoSection slug="secret-scanner" />
    </>
  );
}
