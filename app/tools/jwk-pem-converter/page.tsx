import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JwkPemConverterClient from "./JwkPemConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwk-pem-converter");

export default function JwkPemConverterPage() {
  return (
    <>
      <ToolJsonLd slug="jwk-pem-converter" />
      <JwkPemConverterClient />
      <ToolSeoSection slug="jwk-pem-converter" />
    </>
  );
}
