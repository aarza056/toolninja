import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import AiTokenCounterClient from "./AiTokenCounterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ai-token-counter");

export default function AiTokenCounterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("ai-token-counter")) }}
      />
      <AiTokenCounterClient />
      <ToolSeoSection slug="ai-token-counter" />
    </>
  );
}
