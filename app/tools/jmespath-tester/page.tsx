import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JmespathTesterClient from "./JmespathTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jmespath-tester");

export default function JmespathTesterPage() {
  return (
    <>
      <ToolJsonLd slug="jmespath-tester" />
      <JmespathTesterClient />
      <ToolSeoSection slug="jmespath-tester" />
    </>
  );
}
