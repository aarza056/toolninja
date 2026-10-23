import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import IbanValidatorClient from "./IbanValidatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("iban-validator");

export default function IbanValidatorPage() {
  return (
    <>
      <ToolJsonLd slug="iban-validator" />
      <IbanValidatorClient />
      <ToolSeoSection slug="iban-validator" />
    </>
  );
}
