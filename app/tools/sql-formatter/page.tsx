import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SqlFormatterClient from "./SqlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("sql-formatter");

export default function SqlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("sql-formatter")) }}
      />
      <SqlFormatterClient />
      <ToolSeoSection slug="sql-formatter" />
    </>
  );
}
