import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import FaviconCheckerClient from "./FaviconCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("favicon-checker");

export default function FaviconCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="favicon-checker" />
      <FaviconCheckerClient />
      <ToolSeoSection slug="favicon-checker" />
    </>
  );
}
