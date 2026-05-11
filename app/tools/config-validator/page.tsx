import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ConfigValidatorClient from "./ConfigValidatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("config-validator");

export default function ConfigValidatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("config-validator")) }}
      />
      <ConfigValidatorClient />
      <ToolSeoSection slug="config-validator" />
    </>
  );
}
