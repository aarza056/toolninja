import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CreditCardTestGeneratorClient from "./CreditCardTestGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("credit-card-test-generator");

export default function CreditCardTestGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("credit-card-test-generator")) }}
      />
      <CreditCardTestGeneratorClient />
      <ToolSeoSection slug="credit-card-test-generator" />
    </>
  );
}
