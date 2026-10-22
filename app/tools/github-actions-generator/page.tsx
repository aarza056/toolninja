import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import GithubActionsGeneratorClient from "./GithubActionsGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("github-actions-generator");

export default function GithubActionsGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="github-actions-generator" />
      <GithubActionsGeneratorClient />
      <ToolSeoSection slug="github-actions-generator" />
    </>
  );
}
