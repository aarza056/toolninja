import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import Node26UpgradeCheckerClient from "./Node26UpgradeCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("node-26-upgrade-checker");

export default function Node26UpgradeCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="node-26-upgrade-checker" />
      <Node26UpgradeCheckerClient />
      <ToolSeoSection slug="node-26-upgrade-checker" />
    </>
  );
}
