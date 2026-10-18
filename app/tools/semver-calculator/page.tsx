import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SemverCalculatorClient from "./SemverCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("semver-calculator");

export default function SemverCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("semver-calculator")) }}
      />
      <SemverCalculatorClient />
      <ToolSeoSection slug="semver-calculator" />
    </>
  );
}
