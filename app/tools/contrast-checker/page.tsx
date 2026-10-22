import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ContrastCheckerClient from "./ContrastCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("contrast-checker");

export default function ContrastCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="contrast-checker" />
      <ContrastCheckerClient />
      <ToolSeoSection slug="contrast-checker" />
    </>
  );
}
