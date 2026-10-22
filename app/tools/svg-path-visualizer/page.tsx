import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SvgPathVisualizerClient from "./SvgPathVisualizerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-path-visualizer");

export default function SvgPathVisualizerPage() {
  return (
    <>
      <ToolJsonLd slug="svg-path-visualizer" />
      <SvgPathVisualizerClient />
      <ToolSeoSection slug="svg-path-visualizer" />
    </>
  );
}
