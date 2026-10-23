import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UnicodeExplorerClient from "./UnicodeExplorerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("unicode-explorer");

export default function UnicodeExplorerPage() {
  return (
    <>
      <ToolJsonLd slug="unicode-explorer" />
      <UnicodeExplorerClient />
      <ToolSeoSection slug="unicode-explorer" />
    </>
  );
}
