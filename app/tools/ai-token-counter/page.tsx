import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import AiTokenCounterClient from "./AiTokenCounterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ai-token-counter");

export default function AiTokenCounterPage() {
  return (
    <>
      <ToolJsonLd slug="ai-token-counter" />
      <AiTokenCounterClient />
      <ToolSeoSection slug="ai-token-counter" />
    </>
  );
}
