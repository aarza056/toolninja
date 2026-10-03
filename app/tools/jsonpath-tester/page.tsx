import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsonPathTesterClient from "./JsonPathTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jsonpath-tester");

export default function JsonPathTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jsonpath-tester")) }}
      />
      <JsonPathTesterClient />
      <ToolSeoSection slug="jsonpath-tester" />
    </>
  );
}
