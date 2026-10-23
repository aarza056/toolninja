import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ConfigValidatorClient from "./ConfigValidatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("config-validator");

export default function ConfigValidatorPage() {
  return (
    <>
      <ToolJsonLd slug="config-validator" />
      <ConfigValidatorClient />
      <ToolSeoSection slug="config-validator" />
    </>
  );
}
