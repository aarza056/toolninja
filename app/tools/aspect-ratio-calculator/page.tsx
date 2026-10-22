import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import AspectRatioCalculatorClient from "./AspectRatioCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("aspect-ratio-calculator");

export default function AspectRatioCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="aspect-ratio-calculator" />
      <AspectRatioCalculatorClient />
      <ToolSeoSection slug="aspect-ratio-calculator" />
    </>
  );
}
