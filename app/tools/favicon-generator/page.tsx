import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import FaviconGeneratorClient from "./FaviconGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("favicon-generator");

export default function FaviconGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("favicon-generator")) }}
      />
      <FaviconGeneratorClient />
      <ToolSeoSection slug="favicon-generator" />
    </>
  );
}
