import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonToTypeScriptClient from "./JsonToTypeScriptClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-typescript");

export default function JsonToTypeScriptPage() {
  return (
    <>
      <ToolJsonLd slug="json-to-typescript" />
      <JsonToTypeScriptClient />
      <ToolSeoSection slug="json-to-typescript" />
    </>
  );
}
