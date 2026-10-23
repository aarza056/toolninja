import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UuidGeneratorClient from "./UuidGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("uuid-generator");

export default function UuidGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="uuid-generator" />
      <UuidGeneratorClient />
      <ToolSeoSection slug="uuid-generator" />
    </>
  );
}
