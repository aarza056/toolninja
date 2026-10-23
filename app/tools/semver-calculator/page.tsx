import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SemverCalculatorClient from "./SemverCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("semver-calculator");

export default function SemverCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="semver-calculator" />
      <SemverCalculatorClient />
      <ToolSeoSection slug="semver-calculator" />
    </>
  );
}
