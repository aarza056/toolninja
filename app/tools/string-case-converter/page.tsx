import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import StringCaseConverterClient from "./StringCaseConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("string-case-converter");

export default function StringCaseConverterPage() {
  return (
    <>
      <ToolJsonLd slug="string-case-converter" />
      <StringCaseConverterClient />
      <ToolSeoSection slug="string-case-converter" />
    </>
  );
}
