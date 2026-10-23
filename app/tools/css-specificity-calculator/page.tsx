import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssSpecificityCalculatorClient from "./CssSpecificityCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-specificity-calculator");

export default function CssSpecificityCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="css-specificity-calculator" />
      <CssSpecificityCalculatorClient />
      <ToolSeoSection slug="css-specificity-calculator" />
    </>
  );
}
