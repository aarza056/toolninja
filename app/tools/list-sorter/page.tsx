import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ListSorterClient from "./ListSorterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("list-sorter");

export default function ListSorterPage() {
  return (
    <>
      <ToolJsonLd slug="list-sorter" />
      <ListSorterClient />
      <ToolSeoSection slug="list-sorter" />
    </>
  );
}
