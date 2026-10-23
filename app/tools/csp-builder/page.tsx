import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CspBuilderClient from "./CspBuilderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("csp-builder");

export default function CspBuilderPage() {
  return (
    <>
      <ToolJsonLd slug="csp-builder" />
      <CspBuilderClient />
      <ToolSeoSection slug="csp-builder" />
    </>
  );
}
