import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonPathFinderClient from "./JsonPathFinderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-path-finder");

export default function JsonPathFinderPage() {
  return (
    <>
      <ToolJsonLd slug="json-path-finder" />
      <JsonPathFinderClient />
      <ToolSeoSection slug="json-path-finder" />
    </>
  );
}
