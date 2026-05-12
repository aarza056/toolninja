import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import GitCommandGeneratorClient from "./GitCommandGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("git-command-generator");

export default function GitCommandGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("git-command-generator")) }}
      />
      <GitCommandGeneratorClient />
      <ToolSeoSection slug="git-command-generator" />
    </>
  );
}
