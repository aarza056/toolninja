import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonDiffClient from "./JsonDiffClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-diff");

export default function JsonDiffPage() {
  return (
    <>
      <ToolJsonLd slug="json-diff" />
      <JsonDiffClient />
      <ToolSeoSection slug="json-diff" />
    </>
  );
}
