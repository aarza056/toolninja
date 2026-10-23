import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import JsFormatterClient from "./JsFormatterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("js-formatter");

export default function JsFormatterPage() {
  return (
    <>
      <ToolJsonLd slug="js-formatter" />
      <JsFormatterClient />
      <ToolSeoSection slug="js-formatter" />
    </>
  );
}
