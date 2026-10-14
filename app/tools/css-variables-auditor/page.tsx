import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssVariablesAuditorClient from "./CssVariablesAuditorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-variables-auditor");

export default function CssVariablesAuditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-variables-auditor")) }}
      />
      <CssVariablesAuditorClient />
      <ToolSeoSection slug="css-variables-auditor" />
    </>
  );
}
