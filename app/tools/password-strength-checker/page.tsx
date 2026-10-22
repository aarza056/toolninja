import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PasswordStrengthCheckerClient from "./PasswordStrengthCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("password-strength-checker");

export default function PasswordStrengthCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="password-strength-checker" />
      <PasswordStrengthCheckerClient />
      <ToolSeoSection slug="password-strength-checker" />
    </>
  );
}
