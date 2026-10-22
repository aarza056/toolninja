import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SqlFormatterClient from "./SqlFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("sql-formatter");

export default function SqlFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="sql-formatter" />
      <SqlFormatterClient />
      <ToolSeoSection slug="sql-formatter" />
    </>
  );
}
