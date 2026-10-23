import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import FluidTypographyCalculatorClient from "./FluidTypographyCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("fluid-typography-calculator");

export default function FluidTypographyCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="fluid-typography-calculator" />
      <FluidTypographyCalculatorClient />
      <ToolSeoSection slug="fluid-typography-calculator" />
    </>
  );
}
