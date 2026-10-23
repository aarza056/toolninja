import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import TextDiffClient from "./TextDiffClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("text-diff");

export default function TextDiffPage() {
  return (
    <>
      <ToolJsonLd slug="text-diff" />
      <TextDiffClient />
      <ToolSeoSection slug="text-diff" />
    </>
  );
}
