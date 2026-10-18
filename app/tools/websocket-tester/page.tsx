import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import WebSocketTesterClient from "./WebSocketTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("websocket-tester");

export default function WebSocketTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("websocket-tester")) }}
      />
      <WebSocketTesterClient />
      <ToolSeoSection slug="websocket-tester" />
    </>
  );
}
