import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JwtDecoderClient from "./JwtDecoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-decoder");

export default function JwtDecoderPage() {
  return (
    <>
      <ToolJsonLd slug="jwt-decoder" />
      <JwtDecoderClient />
      <ToolSeoSection slug="jwt-decoder" />
    </>
  );
}
