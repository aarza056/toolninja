import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssGradientClient from "./CssGradientClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-gradient");

export default function CssGradientPage() {
  return (
    <>
      <ToolJsonLd slug="css-gradient" />
      <CssGradientClient />
      <ToolSeoSection slug="css-gradient" />
    </>
  );
}
