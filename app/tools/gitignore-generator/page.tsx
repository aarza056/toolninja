import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import GitignoreGeneratorClient from "./GitignoreGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("gitignore-generator");

export default function GitignoreGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="gitignore-generator" />
      <GitignoreGeneratorClient />
      <ToolSeoSection slug="gitignore-generator" />
    </>
  );
}
