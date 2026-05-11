import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CssGradientClient from "./CssGradientClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-gradient");

export default function CssGradientPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-gradient")) }}
      />
      <CssGradientClient />
      <ToolSeoSection slug="css-gradient" />
    </>
  );
}
