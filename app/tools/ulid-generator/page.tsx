import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UlidGeneratorClient from "./UlidGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ulid-generator");

export default function UlidGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="ulid-generator" />
      <UlidGeneratorClient />
      <ToolSeoSection slug="ulid-generator" />
    </>
  );
}
