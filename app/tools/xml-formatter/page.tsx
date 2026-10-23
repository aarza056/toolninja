import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import XmlFormatterClient from "./XmlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xml-formatter");

export default function XmlFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="xml-formatter" />
      <XmlFormatterClient />
      <ToolSeoSection slug="xml-formatter" />
    </>
  );
}
