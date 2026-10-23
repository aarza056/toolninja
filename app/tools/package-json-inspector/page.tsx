import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PackageJsonInspectorClient from "./PackageJsonInspectorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("package-json-inspector");

export default function PackageJsonInspectorPage() {
  return (
    <>
      <ToolJsonLd slug="package-json-inspector" />
      <PackageJsonInspectorClient />
      <ToolSeoSection slug="package-json-inspector" />
    </>
  );
}
