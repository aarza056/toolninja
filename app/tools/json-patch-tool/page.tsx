import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonPatchToolClient from "./JsonPatchToolClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-patch-tool");

export default function JsonPatchToolPage() {
  return (
    <>
      <ToolJsonLd slug="json-patch-tool" />
      <JsonPatchToolClient />
      <ToolSeoSection slug="json-patch-tool" />
    </>
  );
}
