import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HtmlEntityClient from "./HtmlEntityClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("html-entity");

export default function HtmlEntityPage() {
  return (
    <>
      <ToolJsonLd slug="html-entity" />
      <HtmlEntityClient />
      <ToolSeoSection slug="html-entity" />
    </>
  );
}
