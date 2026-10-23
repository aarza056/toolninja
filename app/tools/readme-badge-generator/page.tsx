import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ReadmeBadgeGeneratorClient from "./ReadmeBadgeGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("readme-badge-generator");

export default function ReadmeBadgeGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="readme-badge-generator" />
      <ReadmeBadgeGeneratorClient />
      <ToolSeoSection slug="readme-badge-generator" />
    </>
  );
}
