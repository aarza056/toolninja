import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HtmlFormatterClient from "./HtmlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("html-formatter");

export default function HtmlFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="html-formatter" />
      <HtmlFormatterClient />
      <ToolSeoSection slug="html-formatter" />
    </>
  );
}
