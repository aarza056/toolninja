"use client";

import { useState } from "react";
import ParticleCloud, { type CloudMode } from "./ParticleCloud";
import AssistantPanel from "./AssistantPanel";

export default function AskPageClient() {
  const [mode, setMode] = useState<CloudMode>("idle");

  return (
    <>
      <div className="relative h-[220px] -mt-4">
        <ParticleCloud mode={mode} gather radius={78} count={120} />
      </div>
      <AssistantPanel onCloudMode={setMode} autoFocus />
    </>
  );
}
