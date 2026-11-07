import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CspCheckerClient from "./CspCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("csp-checker");

export default function CspCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="csp-checker" />
      <CspCheckerClient />
      <ToolSeoSection slug="csp-checker" />
    </>
  );
}
