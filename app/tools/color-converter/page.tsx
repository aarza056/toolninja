import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ColorConverterClient from "./ColorConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-converter");

export default function ColorConverterPage() {
  return (
    <>
      <ToolJsonLd slug="color-converter" />
      <ColorConverterClient />
      <ToolSeoSection slug="color-converter" />
    </>
  );
}
