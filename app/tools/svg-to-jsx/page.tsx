import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SvgToJsxClient from "./SvgToJsxClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("svg-to-jsx");

export default function SvgToJsxPage() {
  return (
    <>
      <ToolJsonLd slug="svg-to-jsx" />
      <SvgToJsxClient />
      <ToolSeoSection slug="svg-to-jsx" />
    </>
  );
}
