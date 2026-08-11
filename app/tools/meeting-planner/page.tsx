import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import MeetingPlannerClient from "./MeetingPlannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("meeting-planner");

export default function MeetingPlannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("meeting-planner")) }}
      />
      <MeetingPlannerClient />
      <ToolSeoSection slug="meeting-planner" />
    </>
  );
}
