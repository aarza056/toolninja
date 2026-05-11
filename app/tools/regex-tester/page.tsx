import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import RegexTesterClient from "./RegexTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("regex-tester");

export default function RegexTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("regex-tester")) }}
      />
      <RegexTesterClient />
      <ToolSeoSection slug="regex-tester" />
    </>
  );
}
