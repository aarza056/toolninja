import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JsFormatterClient from "./JsFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("js-formatter");

export default function JsFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("js-formatter")) }}
      />
      <JsFormatterClient />
      <ToolSeoSection slug="js-formatter" />
    </>
  );
}
