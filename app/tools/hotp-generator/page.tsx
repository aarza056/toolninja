import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HotpGeneratorClient from "./HotpGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("hotp-generator");

export default function HotpGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="hotp-generator" />
      <HotpGeneratorClient />
      <ToolSeoSection slug="hotp-generator" />
    </>
  );
}
