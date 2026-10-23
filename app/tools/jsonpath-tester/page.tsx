import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonPathTesterClient from "./JsonPathTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jsonpath-tester");

export default function JsonPathTesterPage() {
  return (
    <>
      <ToolJsonLd slug="jsonpath-tester" />
      <JsonPathTesterClient />
      <ToolSeoSection slug="jsonpath-tester" />
    </>
  );
}
