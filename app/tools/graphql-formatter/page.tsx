import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import GraphqlFormatterClient from "./GraphqlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("graphql-formatter");

export default function GraphqlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("graphql-formatter")) }}
      />
      <GraphqlFormatterClient />
      <ToolSeoSection slug="graphql-formatter" />
    </>
  );
}
