import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ChmodCalculatorClient from "./ChmodCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("chmod-calculator");

export default function ChmodCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="chmod-calculator" />
      <ChmodCalculatorClient />
      <ToolSeoSection slug="chmod-calculator" />
    </>
  );
}
