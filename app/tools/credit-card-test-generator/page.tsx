import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CreditCardTestGeneratorClient from "./CreditCardTestGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("credit-card-test-generator");

export default function CreditCardTestGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="credit-card-test-generator" />
      <CreditCardTestGeneratorClient />
      <ToolSeoSection slug="credit-card-test-generator" />
    </>
  );
}
