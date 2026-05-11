import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import DiffCheckerClient from "./DiffCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("diff-checker");

export default function DiffCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("diff-checker")) }}
      />
      <DiffCheckerClient />
      <ToolSeoSection slug="diff-checker" />
    </>
  );
}
