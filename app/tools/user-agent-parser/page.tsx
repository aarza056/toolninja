import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UserAgentParserClient from "./UserAgentParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("user-agent-parser");

export default function UserAgentParserPage() {
  return (
    <>
      <ToolJsonLd slug="user-agent-parser" />
      <UserAgentParserClient />
      <ToolSeoSection slug="user-agent-parser" />
    </>
  );
}
