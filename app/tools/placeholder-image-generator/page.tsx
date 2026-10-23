import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PlaceholderImageGeneratorClient from "./PlaceholderImageGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("placeholder-image-generator");

export default function PlaceholderImageGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="placeholder-image-generator" />
      <PlaceholderImageGeneratorClient />
      <ToolSeoSection slug="placeholder-image-generator" />
    </>
  );
}
