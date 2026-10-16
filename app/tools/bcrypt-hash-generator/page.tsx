import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import BcryptHashGeneratorClient from "./BcryptHashGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("bcrypt-hash-generator");

export default function BcryptHashGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("bcrypt-hash-generator")) }}
      />
      <BcryptHashGeneratorClient />
      <ToolSeoSection slug="bcrypt-hash-generator" />
    </>
  );
}
