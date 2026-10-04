import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssFlexboxGeneratorClient from "./CssFlexboxGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-flexbox-generator");

export default function CssFlexboxGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-flexbox-generator")) }}
      />
      <CssFlexboxGeneratorClient />
      <ToolSeoSection slug="css-flexbox-generator" />
    </>
  );
}
