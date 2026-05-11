import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PasswordGeneratorClient from "./PasswordGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("password-generator");

export default function PasswordGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("password-generator")) }}
      />
      <PasswordGeneratorClient />
      <ToolSeoSection slug="password-generator" />
    </>
  );
}
