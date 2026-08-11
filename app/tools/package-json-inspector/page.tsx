import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PackageJsonInspectorClient from "./PackageJsonInspectorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("package-json-inspector");

export default function PackageJsonInspectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("package-json-inspector")) }}
      />
      <PackageJsonInspectorClient />
      <ToolSeoSection slug="package-json-inspector" />
    </>
  );
}
