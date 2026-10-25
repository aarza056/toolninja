"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { exportSubscribers } from "../../newsletter-actions";

export default function ExportButton() {
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const csv = await exportSubscribers();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `toolninja-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  return (
    <button onClick={run} disabled={pending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg bg-[#1a1a1a] border-[#2e2e2e] text-[#dddddd] hover:border-[#444] disabled:opacity-50">
      <Download size={12} /> Export CSV
    </button>
  );
}
