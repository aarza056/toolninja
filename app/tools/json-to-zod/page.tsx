import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsonToZodClient from "./JsonToZodClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("json-to-zod");

export default function JsonToZodPage() {
  return (
    <>
      <ToolJsonLd slug="json-to-zod" />
      <JsonToZodClient />
      <ToolSeoSection slug="json-to-zod" />
    </>
  );
}
