import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import WebSocketTesterClient from "./WebSocketTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("websocket-tester");

export default function WebSocketTesterPage() {
  return (
    <>
      <ToolJsonLd slug="websocket-tester" />
      <WebSocketTesterClient />
      <ToolSeoSection slug="websocket-tester" />
    </>
  );
}
