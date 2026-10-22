import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SlugGeneratorClient from "./SlugGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("slug-generator");

export default function SlugGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="slug-generator" />
      <SlugGeneratorClient />
      <ToolSeoSection slug="slug-generator" />
    </>
  );
}
