import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ColorPaletteClient from "./ColorPaletteClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-palette");

export default function ColorPalettePage() {
  return (
    <>
      <ToolJsonLd slug="color-palette" />
      <ColorPaletteClient />
      <ToolSeoSection slug="color-palette" />
    </>
  );
}
