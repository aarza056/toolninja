import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import GitCommandGeneratorClient from "./GitCommandGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("git-command-generator");

export default function GitCommandGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="git-command-generator" />
      <GitCommandGeneratorClient />
      <ToolSeoSection slug="git-command-generator" />
    </>
  );
}
