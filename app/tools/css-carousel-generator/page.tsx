import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CssCarouselGeneratorClient from "./CssCarouselGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-carousel-generator");

export default function CssCarouselGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="css-carousel-generator" />
      <CssCarouselGeneratorClient />
      <ToolSeoSection slug="css-carousel-generator" />
    </>
  );
}
