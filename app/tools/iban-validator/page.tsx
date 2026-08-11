import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import IbanValidatorClient from "./IbanValidatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("iban-validator");

export default function IbanValidatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("iban-validator")) }}
      />
      <IbanValidatorClient />
      <ToolSeoSection slug="iban-validator" />
    </>
  );
}
