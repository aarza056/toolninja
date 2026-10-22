import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HttpRequestClient from "./HttpRequestClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-request");

export default function HttpRequestPage() {
  return (
    <>
      <ToolJsonLd slug="http-request" />
      <HttpRequestClient />
      <ToolSeoSection slug="http-request" />
    </>
  );
}
