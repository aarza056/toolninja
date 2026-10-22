import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import MeetingPlannerClient from "./MeetingPlannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("meeting-planner");

export default function MeetingPlannerPage() {
  return (
    <>
      <ToolJsonLd slug="meeting-planner" />
      <MeetingPlannerClient />
      <ToolSeoSection slug="meeting-planner" />
    </>
  );
}
