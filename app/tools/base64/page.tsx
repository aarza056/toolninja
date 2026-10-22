import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import Base64Client from "./Base64Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base64");

export default function Base64Page() {
  return (
    <>
      <ToolJsonLd slug="base64" />
      <Base64Client />
      <ToolSeoSection slug="base64" />
    </>
  );
}
