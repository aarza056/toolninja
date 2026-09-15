import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssSpecificityCalculatorClient from "./CssSpecificityCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-specificity-calculator");

export default function CssSpecificityCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-specificity-calculator")) }}
      />
      <CssSpecificityCalculatorClient />
      <ToolSeoSection slug="css-specificity-calculator" />
    </>
  );
}
