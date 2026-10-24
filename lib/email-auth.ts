// SPF, DMARC and DKIM checks — the records Gmail, Yahoo and Outlook require from bulk senders.
// DNS is read through a resolver function so the logic is testable; in the browser it's
// DNS-over-HTTPS (Cloudflare, falling back to Google), which only ever sees the domain names asked for.
//
// SPF follows RFC 7208: include, a, mx, ptr, exists and redirect each cost one DNS lookup, counted
// through every nested include; more than 10 is a PermError (550 5.7.24 at Microsoft 365), and more
// than 2 lookups that find nothing ("void lookups") is too.

export type RecordType = "TXT" | "MX" | "A" | "AAAA";

export interface DnsAnswer {
  status: "ok" | "nxdomain" | "nodata" | "error";
  records: string[];
}

export type Resolver = (name: string, type: RecordType) => Promise<DnsAnswer>;

export type IssueLevel = "error" | "warning" | "info" | "ok";
export interface AuthIssue {
  level: IssueLevel;
  message: string;
}

const TYPE_CODE: Record<RecordType, number> = { TXT: 16, MX: 15, A: 1, AAAA: 28 };

/** TXT data arrives as "chunk" "chunk" (Cloudflare) or already joined (Google). */
export function joinTxt(data: string): string {
  const t = data.trim();
  if (!t.startsWith('"')) return t;
  const parts = t.match(/"((?:[^"\\]|\\.)*)"/g) ?? [];
  return parts.map((p) => p.slice(1, -1).replace(/\\(.)/g, "$1")).join("");
}

async function dohQuery(endpoint: string, name: string, type: RecordType): Promise<DnsAnswer> {
  const res = await fetch(`${endpoint}?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DNS service returned ${res.status}`);
  const body = (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
  if (body.Status === 3) return { status: "nxdomain", records: [] };
  if (body.Status !== 0) return { status: "error", records: [] };
  const records = (body.Answer ?? []).filter((a) => a.type === TYPE_CODE[type]).map((a) => (type === "TXT" ? joinTxt(a.data) : a.data.replace(/\.$/, "")));
  return { status: records.length ? "ok" : "nodata", records };
}

/** DNS-over-HTTPS resolver for the browser, with a per-session cache. */
export function createDohResolver(): Resolver {
  const cache = new Map<string, Promise<DnsAnswer>>();
  return (name, type) => {
    const key = `${type} ${name.toLowerCase()}`;
    if (!cache.has(key)) {
      cache.set(
        key,
        dohQuery("https://cloudflare-dns.com/dns-query", name, type).catch(() =>
          dohQuery("https://dns.google/resolve", name, type).catch(() => ({ status: "error" as const, records: [] }))
        )
      );
    }
    return cache.get(key)!;
  };
}

export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/^[^@]*@/, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  return d;
}

export const isValidDomain = (d: string) => /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/.test(d);

// ─── SPF ─────────────────────────────────────────────────────────────────────

const PROVIDERS: [RegExp, string][] = [
  [/^_spf\.google\.com$/, "Google Workspace"],
  [/^spf\.protection\.outlook\.com$/, "Microsoft 365"],
  [/^amazonses\.com$/, "Amazon SES"],
  [/sendgrid\.net$/, "SendGrid"],
  [/mailgun\.org$/, "Mailgun"],
  [/^spf\.mandrillapp\.com$/, "Mailchimp Transactional"],
  [/^servers\.mcsv\.net$/, "Mailchimp"],
  [/^spf\.mtasv\.net$/, "Postmark"],
  [/zoho(mail)?\.(com|eu|in)$/, "Zoho Mail"],
  [/^spf\.(brevo|sendinblue)\.com$/, "Brevo"],
  [/messagingengine\.com$/, "Fastmail"],
  [/protonmail\.ch$/, "Proton Mail"],
  [/salesforce\.com$/, "Salesforce"],
  [/zendesk\.com$/, "Zendesk"],
  [/hubspotemail\.net$/, "HubSpot"],
  [/^_spf\.mx\.cloudflare\.net$/, "Cloudflare Email Routing"],
];
export const providerName = (domain: string) => PROVIDERS.find(([re]) => re.test(domain))?.[1];

export interface SpfTerm {
  raw: string;
  qualifier: "+" | "-" | "~" | "?";
  mechanism: string;
  value: string;
  lookups: number;
  note?: string;
  child?: SpfNode;
}

export interface SpfNode {
  domain: string;
  record?: string;
  problem?: string;
  terms: SpfTerm[];
}

export interface SpfResult {
  root: SpfNode;
  lookups: number;
  voidLookups: number;
  issues: AuthIssue[];
}

const LOOKUP_MECHANISMS = new Set(["include", "a", "mx", "ptr", "exists", "redirect"]);

export async function analyzeSpf(domain: string, resolve: Resolver): Promise<SpfResult> {
  let lookups = 0;
  let voidLookups = 0;
  const issues: AuthIssue[] = [];
  const visiting = new Set<string>();

  const voidCheck = (a: DnsAnswer) => {
    if (a.status === "nxdomain" || a.status === "nodata") voidLookups++;
  };

  async function evaluate(name: string, depth: number): Promise<SpfNode> {
    const node: SpfNode = { domain: name, terms: [] };
    if (depth > 10) return { ...node, problem: "Too deeply nested" };
    if (visiting.has(name)) return { ...node, problem: "Loops back to a record already being evaluated" };
    visiting.add(name);
    const txt = await resolve(name, "TXT");
    const spf = txt.records.filter((r) => /^v=spf1(\s|$)/i.test(r));
    if (txt.status === "error") node.problem = "DNS lookup failed";
    else if (!spf.length) node.problem = "No SPF record";
    else if (spf.length > 1) node.problem = `${spf.length} SPF records — receivers must treat this as a PermError`;
    if (!spf.length) {
      visiting.delete(name);
      return node;
    }
    node.record = spf[0];

    for (const raw of spf[0].split(/\s+/).slice(1).filter(Boolean)) {
      const m = /^([+\-~?]?)([a-z0-9]+)(?:[:=](.*))?$/i.exec(raw);
      if (!m) {
        node.terms.push({ raw, qualifier: "+", mechanism: "?", value: "", lookups: 0, note: "Syntax error" });
        continue;
      }
      const qualifier = (m[1] || "+") as SpfTerm["qualifier"];
      const mechanism = m[2].toLowerCase();
      const value = m[3] ?? "";
      const term: SpfTerm = { raw, qualifier, mechanism, value, lookups: LOOKUP_MECHANISMS.has(mechanism) ? 1 : 0 };
      lookups += term.lookups;
      const target = (value.split("/")[0] || name).toLowerCase();
      const hasMacro = value.includes("%{");

      if (!["include", "a", "mx", "ptr", "exists", "redirect", "ip4", "ip6", "all", "exp"].includes(mechanism) && !raw.includes("=")) {
        term.note = "Unknown mechanism — a PermError for receivers";
      } else if (hasMacro) {
        term.note = "Uses SPF macros — evaluated per message, so it can't be followed here";
      } else if (mechanism === "include" || mechanism === "redirect") {
        if (!value) term.note = "Missing domain";
        else {
          term.child = await evaluate(target, depth + 1);
          const vendor = providerName(target);
          if (vendor) term.note = vendor;
          if (term.child.problem === "No SPF record") voidLookups++;
        }
      } else if (mechanism === "a") {
        const [a, aaaa] = await Promise.all([resolve(target, "A"), resolve(target, "AAAA")]);
        if (a.status !== "ok" && aaaa.status !== "ok") {
          voidLookups++;
          term.note = "No A/AAAA records (void lookup)";
        }
      } else if (mechanism === "mx") {
        const mx = await resolve(target, "MX");
        voidCheck(mx);
        if (mx.records.length > 10) term.note = `${mx.records.length} MX hosts — more than 10 is a PermError`;
        else if (mx.status !== "ok") term.note = "No MX records (void lookup)";
        else term.note = `${mx.records.length} MX host${mx.records.length === 1 ? "" : "s"}`;
      } else if (mechanism === "ptr") {
        term.note = "Deprecated (RFC 7208) — slow and unreliable; many receivers ignore it";
      } else if (mechanism === "exists") {
        voidCheck(await resolve(target, "A"));
      }
      node.terms.push(term);
    }
    visiting.delete(name);
    return node;
  }

  const root = await evaluate(domain, 0);

  if (!root.record) {
    issues.push({ level: "error", message: root.problem === "DNS lookup failed" ? "Couldn't look up the SPF record — try again." : "No SPF record. Gmail, Yahoo and Outlook reject or junk bulk mail without one." });
    return { root, lookups, voidLookups, issues };
  }
  if (root.problem) issues.push({ level: "error", message: root.problem + "." });

  if (lookups > 10) issues.push({ level: "error", message: `${lookups} DNS lookups — the limit is 10. Receivers return PermError (Microsoft 365: 550 5.7.24) and SPF fails for all your mail. Remove unused includes or replace stable ones with ip4:/ip6: ranges.` });
  else if (lookups >= 8) issues.push({ level: "warning", message: `${lookups} of 10 DNS lookups used — one more sending service could push you over the limit.` });
  else issues.push({ level: "ok", message: `${lookups} of 10 DNS lookups used.` });
  if (voidLookups > 2) issues.push({ level: "error", message: `${voidLookups} lookups found nothing — more than 2 "void lookups" is also a PermError.` });

  const all = root.terms.find((t) => t.mechanism === "all");
  const redirect = root.terms.find((t) => t.mechanism === "redirect");
  if (all?.qualifier === "+") issues.push({ level: "error", message: '"+all" lets every server on the internet send as your domain. Use "~all" or "-all".' });
  else if (all?.qualifier === "?") issues.push({ level: "warning", message: '"?all" (neutral) gives no protection. Use "~all" while testing, then "-all".' });
  else if (all?.qualifier === "~") issues.push({ level: "info", message: '"~all" (soft fail) — fine together with DMARC; "-all" is stricter.' });
  else if (all?.qualifier === "-") issues.push({ level: "ok", message: '"-all": mail from unlisted servers fails SPF.' });
  else if (!redirect) issues.push({ level: "warning", message: 'The record doesn\'t end with an "all" mechanism, so unlisted senders get a neutral result. Add "~all" or "-all".' });
  if (all && root.terms.indexOf(all) !== root.terms.length - 1 && root.terms.slice(root.terms.indexOf(all) + 1).some((t) => t.mechanism !== "exp")) {
    issues.push({ level: "warning", message: 'Everything after "all" is ignored.' });
  }
  const walkTerms = (n: SpfNode, fn: (t: SpfTerm, owner: SpfNode) => void) => n.terms.forEach((t) => (fn(t, n), t.child && walkTerms(t.child, fn)));
  walkTerms(root, (t, owner) => {
    if (t.note?.startsWith("Unknown mechanism") || t.note === "Syntax error") issues.push({ level: "error", message: `"${t.raw}" in ${owner.domain}: ${t.note}.` });
    if (t.mechanism === "ptr" && owner === root) issues.push({ level: "warning", message: '"ptr" is deprecated — replace it with the actual ip4:/ip6: ranges or includes.' });
    if (t.child?.problem && t.child.problem !== "Loops back to a record already being evaluated") issues.push({ level: "error", message: `include:${t.child.domain} — ${t.child.problem}. An include that points nowhere is a PermError.` });
  });
  if (root.record.length > 450) issues.push({ level: "info", message: `The record is ${root.record.length} characters — long records need splitting into 255-character strings, which most DNS panels do for you.` });
  return { root, lookups, voidLookups, issues };
}

// ─── DMARC ───────────────────────────────────────────────────────────────────

export interface DmarcResult {
  record?: string;
  /** The domain the record was found on (the organisational domain when inherited) */
  foundOn?: string;
  tags: Record<string, string>;
  issues: AuthIssue[];
}

const MULTI_PART_SUFFIXES = /\.(co|com|net|org|gov|edu|ac)\.[a-z]{2}$/;
export function orgDomain(domain: string): string {
  const labels = domain.split(".");
  const keep = MULTI_PART_SUFFIXES.test(domain) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

export function parseDmarc(record: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...v] = part.split("=");
    if (k?.trim()) tags[k.trim().toLowerCase()] = v.join("=").trim();
  }
  return tags;
}

export async function analyzeDmarc(domain: string, resolve: Resolver): Promise<DmarcResult> {
  const issues: AuthIssue[] = [];
  const lookup = async (d: string) => (await resolve(`_dmarc.${d}`, "TXT")).records.filter((r) => /^v\s*=\s*DMARC1/i.test(r));
  let records = await lookup(domain);
  let foundOn = domain;
  const org = orgDomain(domain);
  if (!records.length && org !== domain) {
    records = await lookup(org);
    foundOn = org;
  }
  if (!records.length) {
    issues.push({ level: "error", message: "No DMARC record. Gmail, Yahoo and Outlook require one for bulk senders — start with v=DMARC1; p=none; rua=mailto:you@yourdomain to collect reports." });
    return { tags: {}, issues };
  }
  if (records.length > 1) issues.push({ level: "error", message: `${records.length} DMARC records — receivers ignore DMARC entirely when there's more than one.` });
  const record = records[0];
  const tags = parseDmarc(record);
  if (foundOn !== domain) issues.push({ level: "info", message: `No record on _dmarc.${domain}, so the organisational domain's record applies (sp= sets the policy for subdomains).` });

  const p = tags.p?.toLowerCase();
  if (!p) issues.push({ level: "error", message: 'Missing the required "p=" policy tag.' });
  else if (!["none", "quarantine", "reject"].includes(p)) issues.push({ level: "error", message: `p=${tags.p} isn't valid — use none, quarantine or reject.` });
  else if (p === "none") issues.push({ level: "warning", message: "p=none only monitors — spoofed mail still gets delivered. It meets the bulk-sender requirement; move to quarantine, then reject, once reports show your own mail passing." });
  else issues.push({ level: "ok", message: `p=${p}: mail that fails DMARC is ${p === "reject" ? "rejected" : "sent to spam"}.` });
  if (!tags.rua) issues.push({ level: "warning", message: "No rua= address, so you receive no reports and can't see who sends mail as your domain." });
  const pct = tags.pct !== undefined ? Number(tags.pct) : 100;
  if (pct < 100) issues.push({ level: "info", message: `pct=${pct}: the policy applies to only ${pct}% of failing mail.` });
  if (tags.sp && !["none", "quarantine", "reject"].includes(tags.sp.toLowerCase())) issues.push({ level: "error", message: `sp=${tags.sp} isn't valid.` });
  for (const k of ["adkim", "aspf"]) if (tags[k] && !/^[rs]$/i.test(tags[k])) issues.push({ level: "error", message: `${k}=${tags[k]} must be r (relaxed) or s (strict).` });
  if (!/^v\s*=\s*DMARC1\s*;/i.test(record)) issues.push({ level: "error", message: '"v=DMARC1" must be the first tag, followed by ";".' });
  return { record, foundOn, tags, issues };
}

// ─── DKIM ────────────────────────────────────────────────────────────────────

export const COMMON_SELECTORS = ["google", "selector1", "selector2", "k1", "k2", "k3", "s1", "s2", "default", "dkim", "mail", "smtp", "mandrill", "mte1", "pm", "zmail", "fm1", "fm2", "fm3", "protonmail", "protonmail2", "protonmail3", "sig1", "brevo1", "mailjet", "resend", "scph"];

export interface DkimKey {
  selector: string;
  record: string;
  keyType: string;
  bits?: number;
  revoked: boolean;
  testing: boolean;
  issues: AuthIssue[];
}

/** RSA modulus size from a DKIM p= value (SubjectPublicKeyInfo or bare RSAPublicKey DER). */
export function rsaKeyBits(b64: string): number | undefined {
  let bytes: Uint8Array;
  try {
    const bin = atob(b64.replace(/\s+/g, ""));
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
  let pos = 0;
  const readLen = () => {
    let len = bytes[pos++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let i = 0; i < n; i++) len = len * 256 + bytes[pos++];
    }
    return len;
  };
  // Walk into SEQUENCE / BIT STRING wrappers until the first INTEGER, which is the modulus
  for (let guard = 0; guard < 8 && pos < bytes.length; guard++) {
    const tag = bytes[pos++];
    const len = readLen();
    if (tag === 0x30) continue; // SEQUENCE: descend
    if (tag === 0x03) {
      pos++; // BIT STRING: skip the unused-bits byte and descend
      continue;
    }
    if (tag === 0x02) {
      let start = pos;
      let n = len;
      // leading zero padding
      while (n > 0 && bytes[start] === 0) {
        start++;
        n--;
      }
      return n * 8 - Math.clz32(bytes[start]) + 24;
    }
    pos += len; // e.g. the algorithm identifier inside SPKI — skip it
  }
  return undefined;
}

export async function lookupDkim(domain: string, selectors: string[], resolve: Resolver): Promise<DkimKey[]> {
  const found: DkimKey[] = [];
  await Promise.all(
    selectors.map(async (selector) => {
      const ans = await resolve(`${selector}._domainkey.${domain}`, "TXT");
      const record = ans.records.find((r) => /(^|;)\s*(v=DKIM1|k=|p=)/i.test(r));
      if (!record) return;
      const tags = parseDmarc(record);
      const keyType = (tags.k || "rsa").toLowerCase();
      const p = tags.p ?? "";
      const issues: AuthIssue[] = [];
      const revoked = p === "";
      const bits = keyType === "rsa" && p ? rsaKeyBits(p) : undefined;
      if (revoked) issues.push({ level: "info", message: "Empty p= — this key has been revoked." });
      else if (keyType === "rsa" && bits !== undefined) {
        if (bits < 1024) issues.push({ level: "error", message: `${bits}-bit RSA key — receivers treat keys under 1024 bits as insecure and fail them.` });
        else if (bits < 2048) issues.push({ level: "warning", message: `${bits}-bit RSA key works, but 2048-bit is the current recommendation.` });
        else issues.push({ level: "ok", message: `${bits}-bit RSA key.` });
      } else if (keyType === "ed25519") issues.push({ level: "info", message: "Ed25519 key — sign with RSA as well, since not every receiver verifies Ed25519 yet." });
      const testing = /(^|:)y(:|$)/.test(tags.t ?? "");
      if (testing) issues.push({ level: "info", message: "t=y (testing mode) — some receivers ignore failures for this key." });
      found.push({ selector, record, keyType, bits, revoked, testing, issues });
    })
  );
  return found.sort((a, b) => selectors.indexOf(a.selector) - selectors.indexOf(b.selector));
}

export async function lookupMx(domain: string, resolve: Resolver): Promise<{ priority: number; host: string }[]> {
  const ans = await resolve(domain, "MX");
  return ans.records
    .map((r) => {
      const [p, h] = r.split(/\s+/);
      return { priority: Number(p), host: (h ?? "").replace(/\.$/, "") || "." };
    })
    .sort((a, b) => a.priority - b.priority);
}

// ─── generators ──────────────────────────────────────────────────────────────

export const SPF_PROVIDERS: { id: string; label: string; include: string }[] = [
  { id: "google", label: "Google Workspace", include: "_spf.google.com" },
  { id: "microsoft", label: "Microsoft 365", include: "spf.protection.outlook.com" },
  { id: "ses", label: "Amazon SES", include: "amazonses.com" },
  { id: "sendgrid", label: "SendGrid", include: "sendgrid.net" },
  { id: "mailgun", label: "Mailgun", include: "mailgun.org" },
  { id: "mailchimp", label: "Mailchimp", include: "servers.mcsv.net" },
  { id: "mandrill", label: "Mailchimp Transactional", include: "spf.mandrillapp.com" },
  { id: "postmark", label: "Postmark", include: "spf.mtasv.net" },
  { id: "brevo", label: "Brevo", include: "spf.brevo.com" },
  { id: "zoho", label: "Zoho Mail", include: "zohomail.com" },
  { id: "fastmail", label: "Fastmail", include: "spf.messagingengine.com" },
  { id: "proton", label: "Proton Mail", include: "_spf.protonmail.ch" },
];

export interface SpfBuild {
  providers: string[];
  ip4: string;
  ip6: string;
  includes: string;
  includeMx: boolean;
  all: "~all" | "-all";
}

export function buildSpf(o: SpfBuild): { record: string; lookups: number } {
  const split = (s: string) => s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
  const terms = ["v=spf1"];
  if (o.includeMx) terms.push("mx");
  for (const ip of split(o.ip4)) terms.push(`ip4:${ip}`);
  for (const ip of split(o.ip6)) terms.push(`ip6:${ip}`);
  for (const id of o.providers) {
    const p = SPF_PROVIDERS.find((x) => x.id === id);
    if (p) terms.push(`include:${p.include}`);
  }
  for (const inc of split(o.includes)) terms.push(`include:${inc.replace(/^include:/, "")}`);
  terms.push(o.all);
  // mx and every include cost one DNS lookup each (plus whatever the include contains); ip4/ip6 are free
  const lookups = terms.filter((t) => t === "mx" || t.startsWith("include:")).length;
  return { record: terms.join(" "), lookups };
}

export interface DmarcBuild {
  policy: "none" | "quarantine" | "reject";
  subdomainPolicy: "" | "none" | "quarantine" | "reject";
  rua: string;
  ruf: string;
  pct: number;
  adkim: "r" | "s";
  aspf: "r" | "s";
}

export function buildDmarc(o: DmarcBuild): string {
  const mailto = (s: string) =>
    s
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((a) => (a.startsWith("mailto:") ? a : `mailto:${a}`))
      .join(",");
  const parts = ["v=DMARC1", `p=${o.policy}`];
  if (o.subdomainPolicy) parts.push(`sp=${o.subdomainPolicy}`);
  if (o.rua.trim()) parts.push(`rua=${mailto(o.rua)}`);
  if (o.ruf.trim()) parts.push(`ruf=${mailto(o.ruf)}`, "fo=1");
  if (o.pct < 100) parts.push(`pct=${Math.max(0, Math.min(100, Math.round(o.pct)))}`);
  if (o.adkim === "s") parts.push("adkim=s");
  if (o.aspf === "s") parts.push("aspf=s");
  return parts.join("; ");
}
