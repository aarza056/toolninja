import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MetaTagsGeneratorClient from "./MetaTagsGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("meta-tags-generator");

export default function MetaTagsGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="meta-tags-generator" />
      <MetaTagsGeneratorClient />
      <ToolSeoSection slug="meta-tags-generator" />
    </>
  );
}
