import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ColorPaletteClient from "./ColorPaletteClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-palette");

export default function ColorPalettePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("color-palette")) }}
      />
      <ColorPaletteClient />
      <ToolSeoSection slug="color-palette" />
    </>
  );
}
