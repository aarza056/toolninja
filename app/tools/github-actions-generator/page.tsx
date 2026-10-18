import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import GithubActionsGeneratorClient from "./GithubActionsGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("github-actions-generator");

export default function GithubActionsGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("github-actions-generator")) }}
      />
      <GithubActionsGeneratorClient />
      <ToolSeoSection slug="github-actions-generator" />
    </>
  );
}
