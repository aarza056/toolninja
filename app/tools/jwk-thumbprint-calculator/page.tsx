import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JwkThumbprintClient from "./JwkThumbprintClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwk-thumbprint-calculator");

export default function JwkThumbprintPage() {
  return (
    <>
      <ToolJsonLd slug="jwk-thumbprint-calculator" />
      <JwkThumbprintClient />
      <ToolSeoSection slug="jwk-thumbprint-calculator" />
    </>
  );
}
