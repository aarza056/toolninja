import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import McpConfigGeneratorClient from "./McpConfigGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("mcp-config-generator");

export default function McpConfigGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="mcp-config-generator" />
      <McpConfigGeneratorClient />
      <ToolSeoSection slug="mcp-config-generator" />
    </>
  );
}
