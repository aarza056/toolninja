import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PatchGeneratorClient from "./PatchGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("patch-generator");

export default function PatchGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="patch-generator" />
      <PatchGeneratorClient />
      <ToolSeoSection slug="patch-generator" />
    </>
  );
}
