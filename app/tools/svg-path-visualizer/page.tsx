import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SvgPathVisualizerClient from "./SvgPathVisualizerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-path-visualizer");

export default function SvgPathVisualizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("svg-path-visualizer")) }}
      />
      <SvgPathVisualizerClient />
      <ToolSeoSection slug="svg-path-visualizer" />
    </>
  );
}
