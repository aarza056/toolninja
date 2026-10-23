"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { FlaskConical } from "lucide-react";
import { testNinja, type NinjaTestResult } from "@/app/admin/actions";

const usd = (micro: number) => `$${(micro / 1e6).toFixed(micro < 1e5 ? 5 : 4)}`;

export default function NinjaTestConsole() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<NinjaTestResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setRes(await testNinja(q)));
        }}
        className="space-y-2"
      >
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder="Ask exactly what a visitor would — e.g. “why does my cron run every minute: * 9 * * 1-5”"
          className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] placeholder:text-[#555555] focus:outline-none focus:border-[#a855f7]/60"
        />
        <div className="flex items-center gap-3">
          <button
            disabled={pending || !q.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 rounded-lg"
          >
            <FlaskConical size={13} /> {pending ? "Asking…" : "Run test"}
          </button>
          <span className="text-[11px] text-[#666666]">Same model and prompt as the live site. Not counted in stats, the daily cap or the idea board.</span>
        </div>
      </form>

      {res && !res.ok && <p className="text-sm text-[#f87171]">{res.error}</p>}
      {res && res.ok && (
        <div className="p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl space-y-3">
          <div className="text-sm text-[#d4d4d4] leading-relaxed [&_code]:text-[#e879f9] [&_code]:bg-[#1a0a2e] [&_code]:px-1 [&_code]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2">
            <ReactMarkdown>{res.answer}</ReactMarkdown>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div>
              <dt className="inline text-[#777777]">Tools: </dt>
              <dd className="inline text-[#cccccc]">{res.tools.map((t) => t.slug).join(", ") || "none"}</dd>
            </div>
            <div>
              <dt className="inline text-[#777777]">Guides: </dt>
              <dd className="inline text-[#cccccc]">{res.guides.join(", ") || "none"}</dd>
            </div>
            <div>
              <dt className="inline text-[#777777]">Topic: </dt>
              <dd className="inline text-[#cccccc]">{res.topic || "—"}</dd>
            </div>
            <div>
              <dt className="inline text-[#777777]">Unmet need: </dt>
              <dd className="inline text-[#cccccc]">{res.unmet || "— (a tool fits)"}</dd>
            </div>
            <div className="sm:col-span-2 tabular-nums">
              <dt className="inline text-[#777777]">Cost: </dt>
              <dd className="inline text-[#cccccc]">
                {usd(res.cost)} · {res.ms} ms · in {res.usage.input} + cached {res.usage.cacheRead} (written {res.usage.cacheWrite}) · out {res.usage.output} · {res.model}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
