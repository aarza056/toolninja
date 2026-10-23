import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ScrollbarGeneratorClient from "./ScrollbarGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("scrollbar-generator");

export default function ScrollbarGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="scrollbar-generator" />
      <ScrollbarGeneratorClient />
      <ToolSeoSection slug="scrollbar-generator" />
    </>
  );
}
