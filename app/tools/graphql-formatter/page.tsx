import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import GraphqlFormatterClient from "./GraphqlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("graphql-formatter");

export default function GraphqlFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="graphql-formatter" />
      <GraphqlFormatterClient />
      <ToolSeoSection slug="graphql-formatter" />
    </>
  );
}
