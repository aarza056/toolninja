import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UrlParserClient from "./UrlParserClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("url-parser");

export default function UrlParserPage() {
  return (
    <>
      <ToolJsonLd slug="url-parser" />
      <UrlParserClient />
      <ToolSeoSection slug="url-parser" />
    </>
  );
}
