import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import DiffCheckerClient from "./DiffCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("diff-checker");

export default function DiffCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="diff-checker" />
      <DiffCheckerClient />
      <ToolSeoSection slug="diff-checker" />
    </>
  );
}
