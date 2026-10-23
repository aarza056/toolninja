// One-series daily bar chart (oldest → newest). Each bar has its own hover tooltip and the
// numbers are always available in the table that sits under it on the page.
export default function DailyBars({
  data,
  format = (v) => String(v),
  label,
}: {
  data: { date: string; value: number; detail?: string }[];
  format?: (v: number) => string;
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0] ?? { date: "", value: 0 });
  return (
    <figure aria-label={label}>
      <div className="relative h-36 flex items-end gap-[2px] border-b border-[#2a2a2a]">
        {/* recessive gridline at the peak */}
        <span className="absolute left-0 right-0 top-0 border-t border-dashed border-[#1f1f1f]" aria-hidden />
        <span className="absolute right-0 -top-5 text-[10px] text-[#666666] tabular-nums">{format(max)}</span>
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1 h-full flex items-end">
            <div
              className="w-full rounded-t-[4px] bg-[#a855f7] group-hover:bg-[#c084fc] transition-colors"
              style={{ height: d.value ? `${Math.max(2, (d.value / max) * 100)}%` : "0" }}
            />
            {/* hit target is the full column, tooltip above it */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap px-2 py-1 text-[11px] bg-[#1a1a1a] border border-[#333] rounded-md text-[#f5f5f5] shadow-lg">
              <span className="text-[#999999]">{d.date.slice(5)}</span> · {format(d.value)}
              {d.detail && <span className="text-[#999999]"> · {d.detail}</span>}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="flex justify-between mt-1.5 text-[10px] text-[#666666] tabular-nums">
        <span>{data[0]?.date.slice(5)}</span>
        {peak.value > 0 && (
          <span>
            peak {format(peak.value)} on {peak.date.slice(5)}
          </span>
        )}
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </figcaption>
    </figure>
  );
}
