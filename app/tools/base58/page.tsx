import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import Base58Client from "./Base58Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base58");

export default function Base58Page() {
  return (
    <>
      <ToolJsonLd slug="base58" />
      <Base58Client />
      <ToolSeoSection slug="base58" />
    </>
  );
}
