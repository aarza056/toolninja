import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ImageToBase64Client from "./ImageToBase64Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-to-base64");

export default function ImageToBase64Page() {
  return (
    <>
      <ToolJsonLd slug="image-to-base64" />
      <ImageToBase64Client />
      <ToolSeoSection slug="image-to-base64" />
    </>
  );
}
