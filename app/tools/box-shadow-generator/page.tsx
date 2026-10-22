import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import BoxShadowGeneratorClient from "./BoxShadowGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("box-shadow-generator");

export default function BoxShadowGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="box-shadow-generator" />
      <BoxShadowGeneratorClient />
      <ToolSeoSection slug="box-shadow-generator" />
    </>
  );
}
