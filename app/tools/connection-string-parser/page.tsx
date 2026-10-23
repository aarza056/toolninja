import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ConnectionStringParserClient from "./ConnectionStringParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("connection-string-parser");

export default function ConnectionStringParserPage() {
  return (
    <>
      <ToolJsonLd slug="connection-string-parser" />
      <ConnectionStringParserClient />
      <ToolSeoSection slug="connection-string-parser" />
    </>
  );
}
