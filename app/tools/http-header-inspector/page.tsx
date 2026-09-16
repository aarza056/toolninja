import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HttpHeaderInspectorClient from "./HttpHeaderInspectorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-header-inspector");

export default function HttpHeaderInspectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("http-header-inspector")) }}
      />
      <HttpHeaderInspectorClient />
      <ToolSeoSection slug="http-header-inspector" />
    </>
  );
}
