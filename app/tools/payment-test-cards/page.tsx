import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PaymentTestCardsClient from "./PaymentTestCardsClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("payment-test-cards");

export default function PaymentTestCardsPage() {
  return (
    <>
      <ToolJsonLd slug="payment-test-cards" />
      <PaymentTestCardsClient />
      <ToolSeoSection slug="payment-test-cards" />
    </>
  );
}
