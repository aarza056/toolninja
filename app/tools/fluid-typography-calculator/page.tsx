import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import FluidTypographyCalculatorClient from "./FluidTypographyCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("fluid-typography-calculator");

export default function FluidTypographyCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("fluid-typography-calculator")) }}
      />
      <FluidTypographyCalculatorClient />
      <ToolSeoSection slug="fluid-typography-calculator" />
    </>
  );
}
