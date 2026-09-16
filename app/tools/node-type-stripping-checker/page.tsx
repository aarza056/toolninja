import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import NodeTypeStrippingCheckerClient from "./NodeTypeStrippingCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("node-type-stripping-checker");

export default function NodeTypeStrippingCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("node-type-stripping-checker")) }}
      />
      <NodeTypeStrippingCheckerClient />
      <ToolSeoSection slug="node-type-stripping-checker" />
    </>
  );
}
