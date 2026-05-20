import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import XPathTesterClient from "./XPathTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xpath-tester");

export default function XPathTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("xpath-tester")) }}
      />
      <XPathTesterClient />
      <ToolSeoSection slug="xpath-tester" />
    </>
  );
}
