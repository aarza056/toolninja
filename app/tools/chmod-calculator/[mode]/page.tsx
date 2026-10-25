import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMMON_MODES, MODE_USES, parseMode } from "@/lib/chmod-modes";
import ChmodCalculatorClient from "../ChmodCalculatorClient";
import CommonModes from "../CommonModes";

// One page per common mode ("chmod 755", "chmod 644"…): what it means, how it looks in ls -l,
// where it's used, and the calculator pre-filled with it.

export const dynamicParams = false;
export const generateStaticParams = () => COMMON_MODES.map((mode) => ({ mode }));

const word = (b: { r: boolean; w: boolean; x: boolean }) => {
  const parts = [b.r && "read", b.w && "write", b.x && "execute"].filter(Boolean) as string[];
  return parts.length ? parts.join(", ") : "no access";
};

export function generateMetadata({ params }: { params: { mode: string } }): Metadata {
  const info = parseMode(params.mode);
  if (!info || !COMMON_MODES.includes(params.mode)) return {};
  const url = `https://toolninja.io/tools/chmod-calculator/${info.mode}`;
  return {
    title: `chmod ${info.mode} Meaning: ${info.symbolic} Explained`,
    description: `chmod ${info.mode} means ${info.who.map((w) => `${w.label.toLowerCase()}: ${word(w.perms)}`).join("; ")}. When to use it, how it shows in ls -l, and the symbolic form ${info.symbolicCmd}.`,
    alternates: { canonical: url },
    openGraph: { url, title: `chmod ${info.mode} — ${info.symbolic}` },
  };
}

export default function ModePage({ params }: { params: { mode: string } }) {
  const info = parseMode(params.mode);
  if (!info || !COMMON_MODES.includes(params.mode)) notFound();
  const m = info.mode;
  const specialNotes = [
    info.special.setuid && "setuid (4): the program runs with the file owner's privileges.",
    info.special.setgid && "setgid (2): on a directory, new files inherit its group; on a program, it runs with the file's group.",
    info.special.sticky && "sticky bit (1): in a shared directory, users can only delete their own files.",
  ].filter(Boolean) as string[];
  const faq = [
    { q: `What does chmod ${m} mean?`, a: `${info.who.map((w) => `${w.label}: ${word(w.perms)}`).join(". ")}.${specialNotes.length ? ` ${specialNotes.join(" ")}` : ""} In ls -l it shows as ${info.symbolic}.` },
    { q: `What is the symbolic form of chmod ${m}?`, a: `chmod ${info.symbolicCmd} file — it sets exactly the same permissions as chmod ${m}.` },
  ];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };
  const commands = [
    [`chmod ${m} file`, "set it on one file or directory"],
    [`chmod ${info.symbolicCmd} file`, "the same thing in symbolic form"],
    [`chmod -R ${m} dir/`, "recursively — careful: it applies to files and directories alike"],
    [`ls -l file`, `check the result: -${info.symbolic} (a directory shows d${info.symbolic})`],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <ChmodCalculatorClient
        initialOctal={m}
        heading={`chmod ${m} — ${info.symbolic}`}
        intro={`What chmod ${m} allows, when to use it, and the calculator pre-filled with it — toggle any box to compare.`}
      />
      <div className="border-t border-[#1a1a1a] px-6 py-10 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">What chmod {m} allows</h2>
          <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#777777] bg-[#0f0f10]">
                  <th className="px-3 py-2 font-medium">Who</th>
                  <th className="px-3 py-2 font-medium text-center">Read</th>
                  <th className="px-3 py-2 font-medium text-center">Write</th>
                  <th className="px-3 py-2 font-medium text-center">Execute</th>
                </tr>
              </thead>
              <tbody>
                {info.who.map((w) => (
                  <tr key={w.label} className="border-t border-[#1a1a1a]">
                    <td className="px-3 py-2 text-[#dddddd]">{w.label}</td>
                    {(["r", "w", "x"] as const).map((k) => (
                      <td key={k} className={`px-3 py-2 text-center ${w.perms[k] ? "text-[#4ade80]" : "text-[#555555]"}`}>
                        {w.perms[k] ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {specialNotes.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-[#bbbbbb]">
              {specialNotes.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          )}
          {MODE_USES[m] && <p className="mt-3 text-sm text-[#bbbbbb] leading-relaxed">{MODE_USES[m]}</p>}
          {info.worldWritable && (
            <p className="mt-3 p-3 text-sm text-[#fbbf24] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[8px]">
              Every user on the system can modify this. Prefer giving write access through the owner or a group.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Commands</h2>
          <div className="space-y-1.5">
            {commands.map(([cmd, note]) => (
              <div key={cmd} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-2 bg-[#0f0f10] border border-[#222222] rounded-[8px]">
                <code className="font-mono text-sm text-[#e9d5ff]">{cmd}</code>
                <span className="text-xs text-[#888888]">{note}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#777777] leading-relaxed">
            On a directory, read lets you list it, write lets you create and delete entries, and execute lets you enter it and open what&apos;s inside. That&apos;s why
            directories usually get 755 or 750 while files get 644 or 640.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Frequently asked</h2>
          <div className="space-y-4">
            {faq.map((x) => (
              <div key={x.q} className="border-l-2 border-[#a855f7]/40 pl-4">
                <h3 className="text-sm font-medium text-[#dddddd]">{x.q}</h3>
                <p className="text-sm text-[#999999] mt-1 leading-relaxed">{x.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-sm">
          <Link href="/tools/chmod-calculator" className="text-[#a855f7] hover:underline">
            ← Chmod calculator
          </Link>
        </p>
      </div>
      <CommonModes current={m} />
    </>
  );
}
