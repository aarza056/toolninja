import Link from "next/link";
import { COMMON_MODES, parseMode } from "@/lib/chmod-modes";

/** Links to a page for each common mode. Server-rendered so search engines see it. */
export default function CommonModes({ current }: { current?: string }) {
  return (
    <section className="px-6 pb-2 max-w-3xl">
      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Common chmod permissions explained</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COMMON_MODES.map((m) => {
          const info = parseMode(m)!;
          const active = m === current;
          return (
            <Link
              key={m}
              href={`/tools/chmod-calculator/${m}`}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] border text-sm ${active ? "border-[#a855f7]/60 bg-[#a855f7]/10" : "border-[#222222] bg-[#0f0f10] hover:border-[#a855f7]/40"}`}
            >
              <span className="font-mono font-semibold text-[#f5f5f5]">chmod {m}</span>
              <span className="font-mono text-xs text-[#888888]">{info.symbolic}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
