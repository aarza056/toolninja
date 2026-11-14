import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ApiKeyIdentifierClient from "./ApiKeyIdentifierClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("api-key-identifier");

export default function ApiKeyIdentifierPage() {
  return (
    <>
      <ToolJsonLd slug="api-key-identifier" />
      <ApiKeyIdentifierClient />
      <ToolSeoSection slug="api-key-identifier" />
    </>
  );
}
