import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import EmailAuthCheckerClient from "./EmailAuthCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("email-auth-checker");

export default function EmailAuthCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="email-auth-checker" />
      <EmailAuthCheckerClient />
      <ToolSeoSection slug="email-auth-checker" />
    </>
  );
}
