import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import XPathTesterClient from "./XPathTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("xpath-tester");

export default function XPathTesterPage() {
  return (
    <>
      <ToolJsonLd slug="xpath-tester" />
      <XPathTesterClient />
      <ToolSeoSection slug="xpath-tester" />
    </>
  );
}
