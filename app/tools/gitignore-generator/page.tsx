import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import GitignoreGeneratorClient from "./GitignoreGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("gitignore-generator");

export default function GitignoreGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("gitignore-generator")) }}
      />
      <GitignoreGeneratorClient />
      <ToolSeoSection slug="gitignore-generator" />
    </>
  );
}
