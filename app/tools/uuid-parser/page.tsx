import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UuidParserClient from "./UuidParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("uuid-parser");

export default function UuidParserPage() {
  return (
    <>
      <ToolJsonLd slug="uuid-parser" />
      <UuidParserClient />
      <ToolSeoSection slug="uuid-parser" />
    </>
  );
}
