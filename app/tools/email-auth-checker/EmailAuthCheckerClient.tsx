"use client";

import { useEffect, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import FindingList, { type FindingItem } from "@/components/FindingList";
import {
  analyzeSpf,
  analyzeDmarc,
  lookupDkim,
  lookupMx,
  createDohResolver,
  normalizeDomain,
  isValidDomain,
  COMMON_SELECTORS,
  SPF_PROVIDERS,
  buildSpf,
  buildDmarc,
  type SpfNode,
  type SpfResult,
  type DmarcResult,
  type DkimKey,
  type AuthIssue,
  type SpfBuild,
  type DmarcBuild,
} from "@/lib/email-auth";
import { Loader2, Search, Info } from "lucide-react";

const STORAGE_KEY = "toolninja:email-auth-checker";

type Tab = "check" | "spf" | "dmarc";

interface Report {
  domain: string;
  spf: SpfResult;
  dmarc: DmarcResult;
  dkim: DkimKey[];
  mx: { priority: number; host: string }[];
  selectorsTried: string[];
}

const toItems = (issues: AuthIssue[]): FindingItem[] => issues.map((i) => ({ level: i.level, title: i.message }));
const pill = (active: boolean) =>
  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${active ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border-transparent"}`;
const input = "w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function nodeLookups(n: SpfNode): number {
  return n.terms.reduce((s, t) => s + t.lookups + (t.child ? nodeLookups(t.child) : 0), 0);
}

function SpfTree({ node, depth = 0 }: { node: SpfNode; depth?: number }) {
  return (
    <ul className={depth ? "ml-4 pl-3 border-l border-[#262626]" : ""}>
      {node.terms.map((t, i) => (
        <li key={i} className="py-0.5">
          <div className="flex flex-wrap items-baseline gap-2 text-xs font-mono">
            <span className={t.lookups ? "text-[#e879f9]" : "text-[#cccccc]"}>{t.raw}</span>
            {t.lookups > 0 && <span className="text-[10px] text-[#888888]">+{t.lookups}{t.child?.record ? ` (${nodeLookups(t.child) + t.lookups} total)` : ""}</span>}
            {t.note && <span className={`text-[11px] font-sans ${/PermError|void|Syntax|Unknown|No SPF/.test(t.note) ? "text-[#f87171]" : "text-[#888888]"}`}>{t.note}</span>}
            {t.child?.problem && <span className="text-[11px] font-sans text-[#f87171]">{t.child.problem}</span>}
          </div>
          {t.child?.record && <SpfTree node={t.child} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, status, children }: { title: string; status: "ok" | "warning" | "error" | "info"; children: React.ReactNode }) {
  const color = { ok: "text-[#4ade80]", warning: "text-[#fbbf24]", error: "text-[#f87171]", info: "text-[#a3a3a3]" }[status];
  const label = { ok: "Pass", warning: "Check", error: "Fail", info: "Info" }[status];
  return (
    <section className="p-4 bg-[#0d0d0d] border border-[#222222] rounded-[10px] space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>
      {children}
    </section>
  );
}

const worst = (issues: AuthIssue[]): "ok" | "warning" | "error" | "info" => (issues.some((i) => i.level === "error") ? "error" : issues.some((i) => i.level === "warning") ? "warning" : "ok");

export default function EmailAuthCheckerClient() {
  const [tab, setTab] = useState<Tab>("check");
  const [domainInput, setDomainInput] = useState("");
  const [selectors, setSelectors] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const [spfOpts, setSpfOpts] = useState<SpfBuild>({ providers: ["google"], ip4: "", ip6: "", includes: "", includeMx: false, all: "~all" });
  const [dmarcOpts, setDmarcOpts] = useState<DmarcBuild>({ policy: "none", subdomainPolicy: "", rua: "", ruf: "", pct: 100, adkim: "r", aspf: "r" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (saved.domain) setDomainInput(saved.domain);
      if (saved.selectors) setSelectors(saved.selectors);
    } catch {}
  }, []);

  const run = async () => {
    const domain = normalizeDomain(domainInput);
    setError("");
    if (!isValidDomain(domain)) {
      setError("Enter a domain like example.com (an email address or URL works too).");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ domain, selectors }));
    } catch {}
    setLoading(true);
    try {
      const resolve = createDohResolver();
      const custom = selectors.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      const tried = Array.from(new Set([...custom, ...COMMON_SELECTORS]));
      const [spf, dmarc, dkim, mx] = await Promise.all([analyzeSpf(domain, resolve), analyzeDmarc(domain, resolve), lookupDkim(domain, tried, resolve), lookupMx(domain, resolve)]);
      setReport({ domain, spf, dmarc, dkim, mx, selectorsTried: tried });
      setDmarcOpts((o) => ({ ...o, rua: o.rua || `dmarc-reports@${domain}` }));
    } catch {
      setError("Couldn't reach the DNS service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const spfBuilt = buildSpf(spfOpts);
  const dmarcBuilt = buildDmarc(dmarcOpts);
  const toggleProvider = (id: string) => setSpfOpts((o) => ({ ...o, providers: o.providers.includes(id) ? o.providers.filter((p) => p !== id) : [...o.providers, id] }));

  const dkimIssues: AuthIssue[] = report
    ? report.dkim.length
      ? report.dkim.flatMap((k) => k.issues.map((i) => ({ ...i, message: `${k.selector}: ${i.message}` })))
      : [{ level: "warning", message: `No DKIM key found under ${report.selectorsTried.length} common selectors. DKIM can't be listed — find the selector in a received email's DKIM-Signature header (s=…) and add it above.` }]
    : [];

  return (
    <ToolLayout title="SPF, DKIM & DMARC Checker" description="Check a domain's email authentication — SPF lookup count, DMARC policy and DKIM keys — and generate correct records">
      <div className="max-w-4xl space-y-5">
        <div className="flex gap-1">
          <button onClick={() => setTab("check")} className={pill(tab === "check")}>Check a domain</button>
          <button onClick={() => setTab("spf")} className={pill(tab === "spf")}>SPF generator</button>
          <button onClick={() => setTab("dmarc")} className={pill(tab === "dmarc")}>DMARC generator</button>
        </div>

        {tab === "check" && (
          <>
            <div className="grid sm:grid-cols-[1fr_220px_auto] gap-2">
              <input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder="example.com" spellCheck={false} className={`${input} font-mono`} />
              <input value={selectors} onChange={(e) => setSelectors(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder="DKIM selector (optional)" spellCheck={false} className={`${input} font-mono`} />
              <button onClick={run} disabled={loading} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-[6px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Check
              </button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-[#666666] leading-relaxed">
              <Info size={13} className="shrink-0 mt-0.5" />
              DNS records are public. Lookups go from your browser to Cloudflare&apos;s 1.1.1.1 DNS-over-HTTPS service (Google&apos;s as a fallback) — only the domain names are sent, nothing passes through ToolNinja.
            </p>
            {error && <p className="text-xs text-[#f87171]">{error}</p>}

            {report && (
              <div className="space-y-4">
                <Section title={`SPF · ${report.spf.lookups}/10 lookups`} status={worst(report.spf.issues)}>
                  {report.spf.root.record && (
                    <div className="flex items-start gap-2">
                      <code className="flex-1 min-w-0 p-2 text-xs font-mono break-all bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5]">{report.spf.root.record}</code>
                      <CopyButton text={report.spf.root.record} size="sm" />
                    </div>
                  )}
                  <FindingList items={toItems(report.spf.issues)} />
                  {report.spf.root.terms.length > 0 && (
                    <details className="group" open={report.spf.lookups > 7}>
                      <summary className="text-xs text-[#a855f7] cursor-pointer select-none">Include tree (every DNS lookup)</summary>
                      <div className="mt-2 p-3 bg-[#111111] border border-[#222222] rounded-[6px] overflow-x-auto">
                        <p className="text-xs font-mono text-[#888888] mb-1">{report.domain}</p>
                        <SpfTree node={report.spf.root} />
                      </div>
                    </details>
                  )}
                </Section>

                <Section title="DMARC" status={worst(report.dmarc.issues)}>
                  {report.dmarc.record && (
                    <>
                      <div className="flex items-start gap-2">
                        <code className="flex-1 min-w-0 p-2 text-xs font-mono break-all bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5]">{report.dmarc.record}</code>
                        <CopyButton text={report.dmarc.record} size="sm" />
                      </div>
                      <p className="text-xs text-[#666666]">Found on _dmarc.{report.dmarc.foundOn}</p>
                    </>
                  )}
                  <FindingList items={toItems(report.dmarc.issues)} />
                </Section>

                <Section title={`DKIM · ${report.dkim.length} key${report.dkim.length === 1 ? "" : "s"} found`} status={report.dkim.length ? worst(dkimIssues) : "warning"}>
                  {report.dkim.map((k) => (
                    <div key={k.selector} className="text-xs">
                      <p className="font-mono text-[#e879f9]">{k.selector}._domainkey.{report.domain}</p>
                      <p className="mt-0.5 font-mono text-[#888888] break-all line-clamp-2">{k.record}</p>
                    </div>
                  ))}
                  <FindingList items={toItems(dkimIssues)} />
                </Section>

                <Section title="MX (where mail for this domain goes)" status="info">
                  {report.mx.length ? (
                    <ul className="text-xs font-mono text-[#cccccc] space-y-0.5">
                      {report.mx.map((m) => (
                        <li key={m.host + m.priority}>
                          <span className="text-[#666666]">{m.priority}</span> {m.host === "." ? ". (null MX — this domain accepts no mail)" : m.host}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#888888]">No MX records — this domain doesn&apos;t receive email (sending can still work).</p>
                  )}
                </Section>
              </div>
            )}
          </>
        )}

        {tab === "spf" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#888888] font-medium mb-2">Who sends email for your domain?</p>
              <div className="flex flex-wrap gap-2">
                {SPF_PROVIDERS.map((p) => (
                  <label key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-[6px] border cursor-pointer ${spfOpts.providers.includes(p.id) ? "border-[#a855f7]/50 bg-[#a855f7]/10 text-[#f5f5f5]" : "border-[#222222] text-[#999999]"}`}>
                    <input type="checkbox" checked={spfOpts.providers.includes(p.id)} onChange={() => toggleProvider(p.id)} className="accent-[#a855f7]" />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#888888] block mb-1">Your own server IPv4 (ip4:)</label>
                <input value={spfOpts.ip4} onChange={(e) => setSpfOpts({ ...spfOpts, ip4: e.target.value })} placeholder="203.0.113.10, 198.51.100.0/24" className={`${input} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">IPv6 (ip6:)</label>
                <input value={spfOpts.ip6} onChange={(e) => setSpfOpts({ ...spfOpts, ip6: e.target.value })} placeholder="2001:db8::/32" className={`${input} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">Other includes</label>
                <input value={spfOpts.includes} onChange={(e) => setSpfOpts({ ...spfOpts, includes: e.target.value })} placeholder="spf.yourvendor.com" className={`${input} font-mono`} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#cccccc]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={spfOpts.includeMx} onChange={(e) => setSpfOpts({ ...spfOpts, includeMx: e.target.checked })} className="accent-[#a855f7]" /> My MX servers also send (mx)
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={spfOpts.all === "~all"} onChange={() => setSpfOpts({ ...spfOpts, all: "~all" })} className="accent-[#a855f7]" /> ~all (soft fail — start here)
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={spfOpts.all === "-all"} onChange={() => setSpfOpts({ ...spfOpts, all: "-all" })} className="accent-[#a855f7]" /> -all (hard fail)
              </label>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px] space-y-1">
              <div className="flex items-start gap-2">
                <code className="flex-1 min-w-0 text-sm font-mono break-all text-[#f5f5f5]">{spfBuilt.record}</code>
                <CopyButton text={spfBuilt.record} size="sm" />
              </div>
              <p className="text-xs text-[#888888]">
                TXT record on your root domain (@). Top-level lookups: {spfBuilt.lookups} — includes can contain more, so check the published record with the checker. Publish only ONE SPF record; merge into it if one exists.
              </p>
            </div>
          </div>
        )}

        {tab === "dmarc" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888888] block mb-1">Policy (p=)</label>
                <select value={dmarcOpts.policy} onChange={(e) => setDmarcOpts({ ...dmarcOpts, policy: e.target.value as DmarcBuild["policy"] })} className={input}>
                  <option value="none">none — monitor only (start here)</option>
                  <option value="quarantine">quarantine — failing mail goes to spam</option>
                  <option value="reject">reject — failing mail is refused</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">Subdomains (sp=)</label>
                <select value={dmarcOpts.subdomainPolicy} onChange={(e) => setDmarcOpts({ ...dmarcOpts, subdomainPolicy: e.target.value as DmarcBuild["subdomainPolicy"] })} className={input}>
                  <option value="">Same as p=</option>
                  <option value="none">none</option>
                  <option value="quarantine">quarantine</option>
                  <option value="reject">reject</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">Aggregate reports to (rua=)</label>
                <input value={dmarcOpts.rua} onChange={(e) => setDmarcOpts({ ...dmarcOpts, rua: e.target.value })} placeholder="dmarc@example.com" className={`${input} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">Failure reports to (ruf=, optional)</label>
                <input value={dmarcOpts.ruf} onChange={(e) => setDmarcOpts({ ...dmarcOpts, ruf: e.target.value })} placeholder="few providers send these" className={`${input} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] block mb-1">Apply to {dmarcOpts.pct}% of failing mail (pct=)</label>
                <input type="range" min={0} max={100} step={5} value={dmarcOpts.pct} onChange={(e) => setDmarcOpts({ ...dmarcOpts, pct: Number(e.target.value) })} className="w-full accent-[#a855f7]" />
              </div>
              <div className="flex items-end gap-4 text-xs text-[#cccccc] pb-2">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={dmarcOpts.adkim === "s"} onChange={(e) => setDmarcOpts({ ...dmarcOpts, adkim: e.target.checked ? "s" : "r" })} className="accent-[#a855f7]" /> Strict DKIM alignment
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={dmarcOpts.aspf === "s"} onChange={(e) => setDmarcOpts({ ...dmarcOpts, aspf: e.target.checked ? "s" : "r" })} className="accent-[#a855f7]" /> Strict SPF alignment
                </label>
              </div>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px] space-y-1">
              <div className="flex items-start gap-2">
                <code className="flex-1 min-w-0 text-sm font-mono break-all text-[#f5f5f5]">{dmarcBuilt}</code>
                <CopyButton text={dmarcBuilt} size="sm" />
              </div>
              <p className="text-xs text-[#888888]">TXT record named _dmarc (i.e. _dmarc.yourdomain.com). If reports go to another domain, that domain must publish an authorisation record.</p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
