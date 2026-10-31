import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import LlmApiCostCalculatorClient from "./LlmApiCostCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("llm-api-cost-calculator");

export default function LlmApiCostCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="llm-api-cost-calculator" />
      <LlmApiCostCalculatorClient />
      <ToolSeoSection slug="llm-api-cost-calculator" />
    </>
  );
}
