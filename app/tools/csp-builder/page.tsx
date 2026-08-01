import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CspBuilderClient from "./CspBuilderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("csp-builder");

export default function CspBuilderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("csp-builder")) }}
      />
      <CspBuilderClient />
      <ToolSeoSection slug="csp-builder" />
    </>
  );
}
