import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MermaidEditorClient from "./MermaidEditorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("mermaid-editor");

export default function MermaidEditorPage() {
  return (
    <>
      <ToolJsonLd slug="mermaid-editor" />
      <MermaidEditorClient />
      <ToolSeoSection slug="mermaid-editor" />
    </>
  );
}
