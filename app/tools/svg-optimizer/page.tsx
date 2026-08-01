import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SvgOptimizerClient from "./SvgOptimizerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-optimizer");

export default function SvgOptimizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("svg-optimizer")) }}
      />
      <SvgOptimizerClient />
      <ToolSeoSection slug="svg-optimizer" />
    </>
  );
}
