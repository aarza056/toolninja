import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

export type FindingLevel = "error" | "warning" | "info" | "ok";

export interface FindingItem {
  level: FindingLevel;
  title: ReactNode;
  detail?: ReactNode;
  /** Shown before the title, e.g. "line 12" or a server name */
  meta?: ReactNode;
}

const STYLE: Record<FindingLevel, { box: string; text: string; Icon: typeof AlertCircle }> = {
  error: { box: "bg-[#ef4444]/10 border-[#ef4444]/30", text: "text-[#f87171]", Icon: AlertCircle },
  warning: { box: "bg-[#f59e0b]/10 border-[#f59e0b]/30", text: "text-[#fbbf24]", Icon: AlertTriangle },
  info: { box: "bg-[#111111] border-[#222222]", text: "text-[#a3a3a3]", Icon: Info },
  ok: { box: "bg-[#22c55e]/10 border-[#22c55e]/30", text: "text-[#4ade80]", Icon: CheckCircle },
};

export default function FindingList({ items, empty }: { items: FindingItem[]; empty?: ReactNode }) {
  if (!items.length) {
    return empty ? (
      <div className="flex items-center gap-2 p-3 text-sm text-[#4ade80] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px]">
        <CheckCircle size={16} className="shrink-0" />
        {empty}
      </div>
    ) : null;
  }
  return (
    <ul className="space-y-2">
      {items.map((f, i) => {
        const s = STYLE[f.level];
        return (
          <li key={i} className={`p-3 border rounded-[8px] ${s.box}`}>
            <div className="flex items-start gap-2 text-sm">
              <s.Icon size={15} className={`shrink-0 mt-0.5 ${s.text}`} />
              <div className="min-w-0">
                <p className="text-[#f5f5f5] break-words">
                  {f.meta && <span className={`mr-1.5 font-mono text-xs ${s.text}`}>{f.meta}</span>}
                  {f.title}
                </p>
                {f.detail && <p className="mt-1 text-xs leading-relaxed text-[#bbbbbb] break-words whitespace-pre-line">{f.detail}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
