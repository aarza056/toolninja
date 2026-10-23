import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssUnitConverterClient from "./CssUnitConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-unit-converter");

export default function CssUnitConverterPage() {
  return (
    <>
      <ToolJsonLd slug="css-unit-converter" />
      <CssUnitConverterClient />
      <ToolSeoSection slug="css-unit-converter" />
    </>
  );
}
