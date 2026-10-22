import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssXpathConverterClient from "./CssXpathConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-xpath-converter");

export default function CssXpathConverterPage() {
  return (
    <>
      <ToolJsonLd slug="css-xpath-converter" />
      <CssXpathConverterClient />
      <ToolSeoSection slug="css-xpath-converter" />
    </>
  );
}
