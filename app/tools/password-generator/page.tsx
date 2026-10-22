import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PasswordGeneratorClient from "./PasswordGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("password-generator");

export default function PasswordGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="password-generator" />
      <PasswordGeneratorClient />
      <ToolSeoSection slug="password-generator" />
    </>
  );
}
