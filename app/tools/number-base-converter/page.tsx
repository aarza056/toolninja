import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import NumberBaseConverterClient from "./NumberBaseConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("number-base-converter");

export default function NumberBaseConverterPage() {
  return (
    <>
      <ToolJsonLd slug="number-base-converter" />
      <NumberBaseConverterClient />
      <ToolSeoSection slug="number-base-converter" />
    </>
  );
}
