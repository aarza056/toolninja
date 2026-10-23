import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssFlexboxGeneratorClient from "./CssFlexboxGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-flexbox-generator");

export default function CssFlexboxGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="css-flexbox-generator" />
      <CssFlexboxGeneratorClient />
      <ToolSeoSection slug="css-flexbox-generator" />
    </>
  );
}
