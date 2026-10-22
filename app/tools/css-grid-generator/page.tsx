import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssGridGeneratorClient from "./CssGridGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-grid-generator");

export default function CssGridGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="css-grid-generator" />
      <CssGridGeneratorClient />
      <ToolSeoSection slug="css-grid-generator" />
    </>
  );
}
