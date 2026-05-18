const stats = [
  { value: "1,000+", label: "developers" },
  { value: "39",     label: "free tools" },
  { value: "0",      label: "server calls" },
  { value: "100%",   label: "browser only" },
];

export default function TrustBar() {
  return (
    <div className="flex items-center bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden my-4 w-fit max-w-full flex-wrap sm:flex-nowrap">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`flex flex-col items-center px-3 sm:px-4 py-2.5 text-center flex-1 sm:flex-none ${
            i < stats.length - 1 ? "border-r border-[#222222]" : ""
          }`}
        >
          <span className="text-sm font-medium text-[#a855f7] leading-none mb-0.5">
            {stat.value}
          </span>
          <span className="text-[10px] text-[#555555]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
