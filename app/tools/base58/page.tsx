import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import Base58Client from "./Base58Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base58");

export default function Base58Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("base58")) }}
      />
      <Base58Client />
      <ToolSeoSection slug="base58" />
    </>
  );
}
