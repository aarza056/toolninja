import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HttpHeaderInspectorClient from "./HttpHeaderInspectorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-header-inspector");

export default function HttpHeaderInspectorPage() {
  return (
    <>
      <ToolJsonLd slug="http-header-inspector" />
      <HttpHeaderInspectorClient />
      <ToolSeoSection slug="http-header-inspector" />
    </>
  );
}
