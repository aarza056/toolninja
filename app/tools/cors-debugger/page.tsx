import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CorsDebuggerClient from "./CorsDebuggerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cors-debugger");

export default function CorsDebuggerPage() {
  return (
    <>
      <ToolJsonLd slug="cors-debugger" />
      <CorsDebuggerClient />
      <ToolSeoSection slug="cors-debugger" />
    </>
  );
}
