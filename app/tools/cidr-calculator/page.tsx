import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CidrCalculatorClient from "./CidrCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cidr-calculator");

export default function CidrCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("cidr-calculator")) }}
      />
      <CidrCalculatorClient />
      <ToolSeoSection slug="cidr-calculator" />
    </>
  );
}
