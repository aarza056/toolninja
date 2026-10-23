import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import TotpGeneratorClient from "./TotpGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("totp-generator");

export default function TotpGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="totp-generator" />
      <TotpGeneratorClient />
      <ToolSeoSection slug="totp-generator" />
    </>
  );
}
