import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import LoremIpsumClient from "./LoremIpsumClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("lorem-ipsum");

export default function LoremIpsumPage() {
  return (
    <>
      <ToolJsonLd slug="lorem-ipsum" />
      <LoremIpsumClient />
      <ToolSeoSection slug="lorem-ipsum" />
    </>
  );
}
