import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonFormatterClient from "./JsonFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-formatter");

export default function JsonFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="json-formatter" />
      <JsonFormatterClient />
      <ToolSeoSection slug="json-formatter" />
    </>
  );
}
