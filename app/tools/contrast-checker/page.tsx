import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ContrastCheckerClient from "./ContrastCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("contrast-checker");

export default function ContrastCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("contrast-checker")) }}
      />
      <ContrastCheckerClient />
      <ToolSeoSection slug="contrast-checker" />
    </>
  );
}
