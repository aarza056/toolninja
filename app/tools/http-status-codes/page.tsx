import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HttpStatusCodesClient from "./HttpStatusCodesClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-status-codes");

export default function HttpStatusCodesPage() {
  return (
    <>
      <ToolJsonLd slug="http-status-codes" />
      <HttpStatusCodesClient />
      <ToolSeoSection slug="http-status-codes" />
    </>
  );
}
