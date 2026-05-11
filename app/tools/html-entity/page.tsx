import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HtmlEntityClient from "./HtmlEntityClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("html-entity");

export default function HtmlEntityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("html-entity")) }}
      />
      <HtmlEntityClient />
      <ToolSeoSection slug="html-entity" />
    </>
  );
}
