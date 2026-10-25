import Link from "next/link";
import { prefixFacts } from "@/lib/cidr-info";

export const CHEAT_SHEET_PREFIXES = [8, 12, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

/** Subnet mask cheat sheet linking to a page per prefix. Server-rendered so search engines see it. */
export default function CidrCheatSheet({ current }: { current?: number }) {
  return (
    <section className="px-6 pb-2 max-w-3xl">
      <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">CIDR to subnet mask cheat sheet</h2>
      <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#777777] bg-[#0f0f10]">
              <th className="px-3 py-2 font-medium">CIDR</th>
              <th className="px-3 py-2 font-medium">Subnet mask</th>
              <th className="px-3 py-2 font-medium text-right">Addresses</th>
              <th className="px-3 py-2 font-medium text-right">Usable hosts</th>
            </tr>
          </thead>
          <tbody>
            {CHEAT_SHEET_PREFIXES.map((p) => {
              const f = prefixFacts(p);
              const active = p === current;
              return (
                <tr key={p} className={`border-t border-[#1a1a1a] ${active ? "bg-[#a855f7]/10" : ""}`}>
                  <td className="px-3 py-1.5 font-mono">
                    <Link href={`/tools/cidr-calculator/${p}`} className={active ? "text-[#a855f7] font-semibold" : "text-[#c4b5fd] hover:underline"}>
                      /{p}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#dddddd]">{f.mask}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#aaaaaa]">{f.total.toLocaleString("en-US")}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#aaaaaa]">{f.usable.toLocaleString("en-US")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
