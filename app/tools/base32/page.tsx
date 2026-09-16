import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import Base32Client from "./Base32Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base32");

export default function Base32Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("base32")) }}
      />
      <Base32Client />
      <ToolSeoSection slug="base32" />
    </>
  );
}
