import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SvgToJsxClient from "./SvgToJsxClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-to-jsx");

export default function SvgToJsxPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("svg-to-jsx")) }}
      />
      <SvgToJsxClient />
      <ToolSeoSection slug="svg-to-jsx" />
    </>
  );
}
