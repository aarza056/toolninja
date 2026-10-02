import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PasswordStrengthCheckerClient from "./PasswordStrengthCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("password-strength-checker");

export default function PasswordStrengthCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("password-strength-checker")) }}
      />
      <PasswordStrengthCheckerClient />
      <ToolSeoSection slug="password-strength-checker" />
    </>
  );
}
