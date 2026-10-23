import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import Base32Client from "./Base32Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base32");

export default function Base32Page() {
  return (
    <>
      <ToolJsonLd slug="base32" />
      <Base32Client />
      <ToolSeoSection slug="base32" />
    </>
  );
}
