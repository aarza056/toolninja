import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HashGeneratorClient from "./HashGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("hash-generator");

export default function HashGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="hash-generator" />
      <HashGeneratorClient />
      <ToolSeoSection slug="hash-generator" />
    </>
  );
}
