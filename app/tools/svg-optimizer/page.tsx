import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SvgOptimizerClient from "./SvgOptimizerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-optimizer");

export default function SvgOptimizerPage() {
  return (
    <>
      <ToolJsonLd slug="svg-optimizer" />
      <SvgOptimizerClient />
      <ToolSeoSection slug="svg-optimizer" />
    </>
  );
}
