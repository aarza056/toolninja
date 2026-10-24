import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import GoogleAuthenticatorExportDecoderClient from "./GoogleAuthenticatorExportDecoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("google-authenticator-export-decoder");

export default function GoogleAuthenticatorExportDecoderPage() {
  return (
    <>
      <ToolJsonLd slug="google-authenticator-export-decoder" />
      <GoogleAuthenticatorExportDecoderClient />
      <ToolSeoSection slug="google-authenticator-export-decoder" />
    </>
  );
}
