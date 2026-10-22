import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import TimestampConverterClient from "./TimestampConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("timestamp-converter");

export default function TimestampConverterPage() {
  return (
    <>
      <ToolJsonLd slug="timestamp-converter" />
      <TimestampConverterClient />
      <ToolSeoSection slug="timestamp-converter" />
    </>
  );
}
