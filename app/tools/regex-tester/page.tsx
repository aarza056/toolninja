import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import RegexTesterClient from "./RegexTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("regex-tester");

export default function RegexTesterPage() {
  return (
    <>
      <ToolJsonLd slug="regex-tester" />
      <RegexTesterClient />
      <ToolSeoSection slug="regex-tester" />
    </>
  );
}
