import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ListSorterClient from "./ListSorterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("list-sorter");

export default function ListSorterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("list-sorter")) }}
      />
      <ListSorterClient />
      <ToolSeoSection slug="list-sorter" />
    </>
  );
}
