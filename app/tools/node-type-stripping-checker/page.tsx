import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import NodeTypeStrippingCheckerClient from "./NodeTypeStrippingCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("node-type-stripping-checker");

export default function NodeTypeStrippingCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="node-type-stripping-checker" />
      <NodeTypeStrippingCheckerClient />
      <ToolSeoSection slug="node-type-stripping-checker" />
    </>
  );
}
