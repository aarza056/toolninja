import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MermaidEditorClient from "./MermaidEditorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("mermaid-editor");

export default function MermaidEditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("mermaid-editor")) }}
      />
      <MermaidEditorClient />
      <ToolSeoSection slug="mermaid-editor" />
    </>
  );
}
