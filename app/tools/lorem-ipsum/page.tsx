import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import LoremIpsumClient from "./LoremIpsumClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("lorem-ipsum");

export default function LoremIpsumPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("lorem-ipsum")) }}
      />
      <LoremIpsumClient />
      <ToolSeoSection slug="lorem-ipsum" />
    </>
  );
}
