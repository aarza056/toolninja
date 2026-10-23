import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import LicenseGeneratorClient from "./LicenseGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("license-generator");

export default function LicenseGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="license-generator" />
      <LicenseGeneratorClient />
      <ToolSeoSection slug="license-generator" />
    </>
  );
}
