import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import UrlEncoderClient from "./UrlEncoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("url-encoder");

export default function UrlEncoderPage() {
  return (
    <>
      <ToolJsonLd slug="url-encoder" />
      <UrlEncoderClient />
      <ToolSeoSection slug="url-encoder" />
    </>
  );
}
