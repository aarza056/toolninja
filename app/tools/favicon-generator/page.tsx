import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import FaviconGeneratorClient from "./FaviconGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("favicon-generator");

export default function FaviconGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="favicon-generator" />
      <FaviconGeneratorClient />
      <ToolSeoSection slug="favicon-generator" />
    </>
  );
}
