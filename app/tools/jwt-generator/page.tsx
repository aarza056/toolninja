import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JwtGeneratorClient from "./JwtGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-generator");

export default function JwtGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="jwt-generator" />
      <JwtGeneratorClient />
      <ToolSeoSection slug="jwt-generator" />
    </>
  );
}
