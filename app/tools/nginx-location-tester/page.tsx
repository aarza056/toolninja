import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import NginxLocationTesterClient from "./NginxLocationTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("nginx-location-tester");

export default function NginxLocationTesterPage() {
  return (
    <>
      <ToolJsonLd slug="nginx-location-tester" />
      <NginxLocationTesterClient />
      <ToolSeoSection slug="nginx-location-tester" />
    </>
  );
}
