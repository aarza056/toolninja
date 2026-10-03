import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UserAgentParserClient from "./UserAgentParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("user-agent-parser");

export default function UserAgentParserPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("user-agent-parser")) }}
      />
      <UserAgentParserClient />
      <ToolSeoSection slug="user-agent-parser" />
    </>
  );
}
