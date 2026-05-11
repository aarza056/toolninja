import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import Base64Client from "./Base64Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base64");

export default function Base64Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("base64")) }}
      />
      <Base64Client />
      <ToolSeoSection slug="base64" />
    </>
  );
}
