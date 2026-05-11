import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import TextDiffClient from "./TextDiffClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("text-diff");

export default function TextDiffPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("text-diff")) }}
      />
      <TextDiffClient />
      <ToolSeoSection slug="text-diff" />
    </>
  );
}
