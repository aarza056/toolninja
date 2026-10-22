import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import XmlJsonConverterClient from "./XmlJsonConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xml-json-converter");

export default function XmlJsonConverterPage() {
  return (
    <>
      <ToolJsonLd slug="xml-json-converter" />
      <XmlJsonConverterClient />
      <ToolSeoSection slug="xml-json-converter" />
    </>
  );
}
