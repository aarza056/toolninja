import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import BcryptHashGeneratorClient from "./BcryptHashGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("bcrypt-hash-generator");

export default function BcryptHashGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="bcrypt-hash-generator" />
      <BcryptHashGeneratorClient />
      <ToolSeoSection slug="bcrypt-hash-generator" />
    </>
  );
}
