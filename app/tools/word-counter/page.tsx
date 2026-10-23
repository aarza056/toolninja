import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import WordCounterClient from "./WordCounterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("word-counter");

export default function WordCounterPage() {
  return (
    <>
      <ToolJsonLd slug="word-counter" />
      <WordCounterClient />
      <ToolSeoSection slug="word-counter" />
    </>
  );
}
