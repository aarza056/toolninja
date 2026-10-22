import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssVariablesAuditorClient from "./CssVariablesAuditorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-variables-auditor");

export default function CssVariablesAuditorPage() {
  return (
    <>
      <ToolJsonLd slug="css-variables-auditor" />
      <CssVariablesAuditorClient />
      <ToolSeoSection slug="css-variables-auditor" />
    </>
  );
}
