import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ChmodCalculatorClient from "./ChmodCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("chmod-calculator");

export default function ChmodCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("chmod-calculator")) }}
      />
      <ChmodCalculatorClient />
      <ToolSeoSection slug="chmod-calculator" />
    </>
  );
}
