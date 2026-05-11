import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UnicodeExplorerClient from "./UnicodeExplorerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("unicode-explorer");

export default function UnicodeExplorerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("unicode-explorer")) }}
      />
      <UnicodeExplorerClient />
      <ToolSeoSection slug="unicode-explorer" />
    </>
  );
}
