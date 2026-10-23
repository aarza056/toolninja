import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JwtKeypairGeneratorClient from "./JwtKeypairGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-keypair-generator");

export default function JwtKeypairGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="jwt-keypair-generator" />
      <JwtKeypairGeneratorClient />
      <ToolSeoSection slug="jwt-keypair-generator" />
    </>
  );
}
