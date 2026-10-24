import { decodeCertificates, formatDn } from "./x509";
import { inspectPublicKey } from "./ssh-keygen";
import { parseId } from "./uuid-parser";
import { parseOtpauthUrl } from "./totp";
import { decodeMigration } from "./otpauth-migration";
import { isBcryptHash, bcryptCost } from "./bcrypt-tool";
import { parseColor, toHex } from "./contrast";
import { parseUserAgent } from "./user-agent-parser";
import { parseCurl } from "./curl-parser";
import { parseConnectionString } from "./connection-string";
import { luhnIsValid, detectCardNetwork } from "./card-test-numbers";
import { validateIban } from "./iban";
import { matchError, type ErrorArticleIndex } from "./error-matcher";

export interface DetectionField {
  label: string;
  value: string;
}

export interface Detection {
  id: string;
  label: string;
  confidence: "high" | "medium";
  summary: string;
  fields: DetectionField[];
  tools: string[];
  guides?: { slug: string; title: string }[];
  warning?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array | null {
  try {
    const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function utf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Share of characters that are printable text (letters, digits, punctuation, whitespace). */
function printableRatio(s: string): number {
  if (!s.length) return 0;
  let ok = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127) || c >= 160) ok++;
  }
  return ok / s.length;
}

function relativeTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [365 * 86400000, "year"],
    [30 * 86400000, "month"],
    [86400000, "day"],
    [3600000, "hour"],
    [60000, "minute"],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms);
      return diff < 0 ? `${n} ${name}${n === 1 ? "" : "s"} ago` : `in ${n} ${name}${n === 1 ? "" : "s"}`;
    }
  }
  return diff < 0 ? "just now" : "in under a minute";
}

function truncate(s: string, n = 120): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const PLAUSIBLE_MIN = Date.UTC(1990, 0, 1);
const PLAUSIBLE_MAX = Date.UTC(2100, 0, 1);

// ─── individual detectors ────────────────────────────────────────────────────

function detectJwt(s: string): Detection | null {
  if (!/^eyJ[\w-]*\.eyJ[\w-]*\.[\w-]*$/.test(s)) return null;
  const [h, p] = s.split(".");
  const header = utf8(b64ToBytes(h) ?? new Uint8Array());
  const payload = utf8(b64ToBytes(p) ?? new Uint8Array());
  if (!header || !payload) return null;
  try {
    const head = JSON.parse(header) as Record<string, unknown>;
    const body = JSON.parse(payload) as Record<string, unknown>;
    const fields: DetectionField[] = [{ label: "Algorithm", value: String(head.alg ?? "?") }];
    for (const key of ["iss", "sub", "aud"]) if (body[key] !== undefined) fields.push({ label: key, value: truncate(String(body[key]), 80) });
    let summary = `Signed with ${head.alg ?? "an unknown algorithm"}`;
    if (typeof body.exp === "number") {
      const exp = new Date(body.exp * 1000);
      const expired = exp.getTime() < Date.now();
      fields.push({ label: "Expires", value: `${exp.toUTCString()} (${expired ? "expired " : ""}${relativeTime(exp)})` });
      summary += expired ? " · expired" : ` · expires ${relativeTime(exp)}`;
    }
    if (typeof body.iat === "number") fields.push({ label: "Issued", value: new Date(body.iat * 1000).toUTCString() });
    return {
      id: "jwt",
      label: "JSON Web Token (JWT)",
      confidence: "high",
      summary,
      fields,
      tools: ["jwt-decoder", "jwt-generator"],
      warning: "JWTs often grant access — avoid sharing real tokens.",
    };
  } catch {
    return null;
  }
}

async function detectPem(s: string): Promise<Detection | null> {
  if (s.includes("-----BEGIN CERTIFICATE-----")) {
    try {
      const certs = await decodeCertificates(s);
      const c = certs[0];
      const cn = c.subject.find((x) => x.type === "CN")?.value ?? formatDn(c.subject);
      const expired = c.notAfter.getTime() < Date.now();
      return {
        id: "x509",
        label: certs.length > 1 ? `X.509 certificate chain (${certs.length} certificates)` : "X.509 certificate",
        confidence: "high",
        summary: `${cn} · ${expired ? "expired" : "expires"} ${relativeTime(c.notAfter)}`,
        fields: [
          { label: "Subject", value: formatDn(c.subject) },
          { label: "Issuer", value: formatDn(c.issuer) },
          { label: "Valid until", value: c.notAfter.toUTCString() },
          { label: "Key", value: c.publicKey },
          ...(c.subjectAltNames.length ? [{ label: "SANs", value: truncate(c.subjectAltNames.join(", "), 160) }] : []),
        ],
        tools: ["certificate-decoder"],
      };
    } catch {
      return null;
    }
  }
  const key = s.match(/-----BEGIN ((?:RSA |EC |OPENSSH |ENCRYPTED )?(PRIVATE|PUBLIC) KEY)-----/);
  if (key) {
    const isPrivate = key[2] === "PRIVATE";
    return {
      id: "pem-key",
      label: `PEM ${key[1].toLowerCase()}`,
      confidence: "high",
      summary: isPrivate ? "A private key — this grants access to whatever it protects" : "A public key",
      fields: [{ label: "Type", value: key[1] }],
      tools: isPrivate ? ["jwk-pem-converter", "secret-scanner"] : ["jwk-pem-converter", "jwk-thumbprint-calculator"],
      warning: isPrivate ? "This is a private key. Never paste it into websites or chats — rotate it if it was exposed." : undefined,
    };
  }
  return null;
}

async function detectSshKey(s: string): Promise<Detection | null> {
  if (!/^(ssh-(ed25519|rsa|dss)|ecdsa-sha2-\S+) AAAA/.test(s)) return null;
  try {
    const k = await inspectPublicKey(s);
    return {
      id: "ssh-key",
      label: "SSH public key",
      confidence: "high",
      summary: `${k.keyType}${k.bits ? ` · ${k.bits} bits` : ""}${k.comment ? ` · ${k.comment}` : ""}`,
      fields: [
        { label: "Fingerprint", value: k.fingerprint },
        ...(k.comment ? [{ label: "Comment", value: k.comment }] : []),
      ],
      tools: ["ssh-key-generator"],
    };
  } catch {
    return null;
  }
}

function detectOtpauth(s: string): Detection | null {
  if (/^otpauth-migration:\/\//i.test(s)) {
    let count = 0;
    try {
      count = decodeMigration(s).accounts.length;
    } catch {}
    return {
      id: "otpauth-migration",
      label: "Google Authenticator export",
      confidence: "high",
      summary: count ? `${count} account${count === 1 ? "" : "s"} in a Google Authenticator transfer code` : "A Google Authenticator transfer code",
      fields: [],
      tools: ["google-authenticator-export-decoder", "totp-generator"],
      warning: "This contains 2FA secrets. Anyone with it can generate your login codes.",
    };
  }
  if (!s.startsWith("otpauth://")) return null;
  const parsed = parseOtpauthUrl(s);
  const isHotp = s.startsWith("otpauth://hotp");
  return {
    id: "otpauth",
    label: isHotp ? "HOTP (2FA) setup URL" : "TOTP (2FA) setup URL",
    confidence: "high",
    summary: parsed ? `${parsed.issuer || "Unknown issuer"} · ${parsed.label}` : "An authenticator-app setup link",
    fields: parsed
      ? [
          { label: "Issuer", value: parsed.issuer || "—" },
          { label: "Account", value: parsed.label },
          { label: "Settings", value: `${parsed.opts.digits} digits · ${parsed.opts.period}s · ${parsed.opts.algorithm}` },
        ]
      : [],
    tools: isHotp ? ["hotp-generator"] : ["totp-generator", "qr-code-generator"],
    warning: "This contains a 2FA secret. Anyone with it can generate your login codes.",
  };
}

function detectIds(s: string): Detection | null {
  const parsed = parseId(s);
  if (!parsed) return null;
  if (parsed.kind === "ulid") {
    return {
      id: "ulid",
      label: "ULID",
      confidence: "high",
      summary: `Created ${parsed.timestamp.toUTCString()}`,
      fields: [{ label: "Timestamp", value: `${parsed.timestamp.toISOString()} (${relativeTime(parsed.timestamp)})` }],
      tools: ["uuid-parser", "ulid-generator"],
    };
  }
  return {
    id: "uuid",
    label: `UUID ${parsed.versionLabel}`,
    confidence: "high",
    summary: parsed.timestamp ? `Created ${parsed.timestamp.toUTCString()}` : `Version ${parsed.version}, ${parsed.variant}`,
    fields: [
      { label: "Version", value: parsed.versionLabel },
      { label: "Variant", value: parsed.variant },
      ...(parsed.timestamp ? [{ label: "Embedded time", value: parsed.timestamp.toISOString() }] : []),
    ],
    tools: ["uuid-parser", "uuid-generator"],
  };
}

function detectTimestamp(s: string): Detection | null {
  if (!/^\d{9,13}$/.test(s)) return null;
  const n = Number(s);
  const ms = s.length >= 12 ? n : n * 1000;
  if (ms < PLAUSIBLE_MIN || ms > PLAUSIBLE_MAX) return null;
  const d = new Date(ms);
  return {
    id: "unix-timestamp",
    label: `Unix timestamp (${s.length >= 12 ? "milliseconds" : "seconds"})`,
    confidence: s.length === 10 || s.length === 13 ? "high" : "medium",
    summary: `${d.toUTCString()} · ${relativeTime(d)}`,
    fields: [
      { label: "UTC", value: d.toISOString() },
      { label: "Relative", value: relativeTime(d) },
    ],
    tools: ["timestamp-converter"],
  };
}

function detectIsoDate(s: string): Detection | null {
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s)) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return {
    id: "iso-date",
    label: "ISO 8601 date",
    confidence: "high",
    summary: `${relativeTime(d)} · Unix ${Math.floor(d.getTime() / 1000)}`,
    fields: [
      { label: "Unix seconds", value: String(Math.floor(d.getTime() / 1000)) },
      { label: "UTC", value: d.toUTCString() },
    ],
    tools: ["timestamp-converter"],
  };
}

function detectCron(s: string): Detection | null {
  const parts = s.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return null;
  const field = /^(\*|\?|[0-9]+|[A-Z]{3})([-\/,][0-9A-Z*]+)*$|^\*\/[0-9]+$|^[0-9LW#]+$/i;
  if (!parts.every((p) => field.test(p))) return null;
  if (!parts.some((p) => p.includes("*") || p.includes("/") || p.includes(","))) return null;
  return {
    id: "cron",
    label: parts.length === 6 ? "Cron expression (6 fields, with seconds)" : "Cron expression",
    confidence: "high",
    summary: "A recurring schedule — see the exact next run times in the cron tester",
    fields: [{ label: "Fields", value: parts.length === 6 ? "second minute hour day month weekday" : "minute hour day month weekday" }],
    tools: ["cron-tester"],
  };
}

function detectNetwork(s: string): Detection | null {
  const ipv4 = "(?:\\d{1,3}\\.){3}\\d{1,3}";
  const cidr = s.match(new RegExp(`^(${ipv4})\\/(\\d{1,2})$`));
  if (cidr && Number(cidr[2]) <= 32 && cidr[1].split(".").every((o) => Number(o) <= 255)) {
    const count = Math.pow(2, 32 - Number(cidr[2]));
    return {
      id: "cidr",
      label: "IPv4 CIDR block",
      confidence: "high",
      summary: `${count.toLocaleString("en-US")} addresses`,
      fields: [{ label: "Prefix", value: `/${cidr[2]}` }, { label: "Addresses", value: count.toLocaleString("en-US") }],
      tools: ["cidr-calculator"],
    };
  }
  if (new RegExp(`^${ipv4}\\s*(-|–|to)\\s*${ipv4}$`, "i").test(s)) {
    return { id: "ip-range", label: "IPv4 address range", confidence: "high", summary: "Convert this range to CIDR blocks", fields: [], tools: ["cidr-calculator"] };
  }
  if (new RegExp(`^${ipv4}$`).test(s) && s.split(".").every((o) => Number(o) <= 255)) {
    const isMask = /^255\./.test(s);
    return {
      id: isMask ? "subnet-mask" : "ipv4",
      label: isMask ? "Subnet mask" : "IPv4 address",
      confidence: "high",
      summary: isMask ? "Convert to CIDR prefix notation" : "Calculate its network, or add a /prefix",
      fields: [],
      tools: ["cidr-calculator"],
    };
  }
  if (/^[0-9a-f:]+(\/\d{1,3})?$/i.test(s) && s.includes("::") || /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}(\/\d{1,3})?$/i.test(s)) {
    return { id: "ipv6", label: "IPv6 address", confidence: "high", summary: "Expand, compress, or calculate its network", fields: [], tools: ["cidr-calculator"] };
  }
  return null;
}

function detectColor(s: string): Detection | null {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) && !/^rgba?\(/i.test(s)) return null;
  const rgb = parseColor(s);
  if (!rgb) return null;
  return {
    id: "color",
    label: "Color",
    confidence: "high",
    summary: `${toHex(rgb)} · rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    fields: [
      { label: "HEX", value: toHex(rgb) },
      { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    ],
    tools: ["color-converter", "contrast-checker", "color-palette"],
  };
}

function detectConnectionString(s: string): Detection | null {
  if (!/^(postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|redis|rediss|amqp|mssql):\/\//i.test(s)) return null;
  try {
    const p = parseConnectionString(s);
    return {
      id: "connection-string",
      label: "Database connection string",
      confidence: "high",
      summary: `${p.scheme} · ${p.host}${p.port ? ":" + p.port : ""}${p.database ? " / " + p.database : ""}`,
      fields: [
        { label: "Host", value: p.host },
        { label: "User", value: p.user || "—" },
        { label: "Password", value: p.password ? "•".repeat(8) + " (hidden)" : "—" },
        { label: "Database", value: p.database || "—" },
      ],
      tools: ["connection-string-parser"],
      warning: p.password ? "This includes a password — rotate it if this string was shared." : undefined,
    };
  } catch {
    return null;
  }
}

function detectCurl(s: string): Detection | null {
  if (!/^curl\s/i.test(s)) return null;
  const p = parseCurl(s);
  if (p.error || !p.url) return null;
  return {
    id: "curl",
    label: "cURL command",
    confidence: "high",
    summary: `${p.method} ${truncate(p.url, 80)}`,
    fields: [
      { label: "Method", value: p.method },
      { label: "Headers", value: String(Object.keys(p.headers).length) },
    ],
    tools: ["curl-to-code", "http-request"],
  };
}

function detectDockerRun(s: string): Detection | null {
  if (!/^docker\s+(container\s+)?run\s/i.test(s)) return null;
  return {
    id: "docker-run",
    label: "docker run command",
    confidence: "high",
    summary: "Convert it to a docker-compose.yml service",
    fields: [],
    tools: ["docker-run-to-compose", "dockerfile-generator"],
  };
}

function detectBcrypt(s: string): Detection | null {
  if (!isBcryptHash(s)) return null;
  return {
    id: "bcrypt",
    label: "bcrypt password hash",
    confidence: "high",
    summary: `Cost factor ${bcryptCost(s)}`,
    fields: [{ label: "Cost", value: String(bcryptCost(s)) }],
    tools: ["bcrypt-hash-generator"],
  };
}

function detectJson(s: string): Detection | null {
  if (!/^[[{]/.test(s)) return null;
  let value: unknown;
  try {
    value = JSON.parse(s);
  } catch {
    return null;
  }
  const obj = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  if (obj && typeof obj.kty === "string") {
    return { id: "jwk", label: "JSON Web Key (JWK)", confidence: "high", summary: `Key type ${obj.kty}`, fields: [], tools: ["jwk-pem-converter", "jwk-thumbprint-calculator"] };
  }
  if (obj && obj.compilerOptions) {
    return { id: "tsconfig", label: "tsconfig.json", confidence: "high", summary: "TypeScript compiler config", fields: [], tools: ["ts7-migration-checker", "json-formatter"] };
  }
  if (obj && (obj.dependencies || obj.devDependencies) && obj.name) {
    return { id: "package-json", label: "package.json", confidence: "high", summary: String(obj.name), fields: [], tools: ["package-json-inspector", "node-26-upgrade-checker", "semver-calculator"] };
  }
  const servers = obj && ((obj.mcpServers ?? obj.servers) as Record<string, unknown> | undefined);
  if (servers && typeof servers === "object" && Object.values(servers).some((v) => v && typeof v === "object" && ("command" in v || "url" in v || "serverUrl" in v))) {
    return { id: "mcp-config", label: "MCP server config", confidence: "high", summary: `${Object.keys(servers).length} server${Object.keys(servers).length === 1 ? "" : "s"}`, fields: [], tools: ["mcp-config-generator", "json-formatter"] };
  }
  if (obj && (obj.json_schema || obj.input_schema || (obj.type === "object" && obj.properties) || (obj.$schema && obj.properties))) {
    return { id: "json-schema", label: "JSON Schema", confidence: "high", summary: "Check it for OpenAI, Claude and Gemini structured outputs", fields: [], tools: ["llm-schema-checker", "json-schema-generator", "json-formatter"] };
  }
  const summary = Array.isArray(value) ? `Array of ${value.length} item${value.length === 1 ? "" : "s"}` : obj ? `Object with ${Object.keys(obj).length} keys` : "JSON value";
  return {
    id: "json",
    label: "JSON",
    confidence: "high",
    summary,
    fields: [],
    tools: ["json-formatter", "json-to-typescript", "json-to-zod", "json-schema-generator"],
  };
}

function detectEmailAuth(s: string): Detection | null {
  const m = /^"?(v=spf1|v=DMARC1|v=DKIM1)\b/i.exec(s);
  if (!m) return null;
  const kind = m[1].toUpperCase() === "V=SPF1" ? "SPF" : m[1].toUpperCase() === "V=DMARC1" ? "DMARC" : "DKIM";
  return {
    id: "email-auth",
    label: `${kind} record`,
    confidence: "high",
    summary: kind === "SPF" ? `${(s.match(/\binclude:/gi) ?? []).length} include(s) — check the full lookup count for your domain` : "Email authentication DNS record",
    fields: [],
    tools: ["email-auth-checker"],
  };
}

function detectWorkflow(s: string): Detection | null {
  if (!/^\s*jobs:\s*$/m.test(s) || !/(runs-on:|uses:)/.test(s)) return null;
  return {
    id: "github-workflow",
    label: "GitHub Actions workflow",
    confidence: "high",
    summary: "Audit it for unpinned actions and script injection",
    fields: [],
    tools: ["github-actions-generator", "config-validator"],
  };
}

function detectUserAgent(s: string): Detection | null {
  if (!/^Mozilla\/\d|^[\w.-]+\/[\d.]+ \(/.test(s)) return null;
  const ua = parseUserAgent(s);
  const browser = ua.browser ? `${ua.browser.name} ${ua.browser.version}` : "Unknown browser";
  const os = ua.os ? `${ua.os.name} ${ua.os.version}`.trim() : "unknown OS";
  return {
    id: "user-agent",
    label: "User-Agent string",
    confidence: "high",
    summary: ua.isBot ? `Bot / crawler · ${browser}` : `${browser} on ${os} · ${ua.device.type}`,
    fields: [],
    tools: ["user-agent-parser"],
  };
}

function detectMarkup(s: string): Detection | null {
  if (!/^</.test(s)) return null;
  if (/^<svg[\s>]/i.test(s)) return { id: "svg", label: "SVG", confidence: "high", summary: "Optimize it or convert it to a React component", fields: [], tools: ["svg-optimizer", "svg-to-jsx"] };
  if (/^<(!doctype html|html|div|body|head|span|p|a|section|ul)[\s>]/i.test(s)) {
    return { id: "html", label: "HTML", confidence: "high", summary: "Format it, or query it with XPath", fields: [], tools: ["html-formatter", "xpath-tester", "html-entity"] };
  }
  if (/^<\?xml|^<[\w:-]+[\s>]/.test(s) && /<\/[\w:-]+>\s*$/.test(s)) {
    return { id: "xml", label: "XML", confidence: "high", summary: "Format, validate, or query it", fields: [], tools: ["xml-formatter", "xpath-tester", "xml-json-converter"] };
  }
  return null;
}

function detectSql(s: string): Detection | null {
  if (!/^(select|insert|update|delete|create|alter|drop|with)\s/i.test(s)) return null;
  if (!/\b(from|into|set|table|values|where|as)\b/i.test(s)) return null;
  return { id: "sql", label: "SQL", confidence: "high", summary: "Format or minify it", fields: [], tools: ["sql-formatter"] };
}

function detectUrl(s: string): Detection | null {
  if (!/^https?:\/\/\S+$/i.test(s)) return null;
  try {
    const u = new URL(s);
    const params = Array.from(u.searchParams.keys());
    const encoded = /%[0-9a-f]{2}/i.test(s);
    return {
      id: "url",
      label: "URL",
      confidence: "high",
      summary: `${u.hostname}${params.length ? ` · ${params.length} query parameter${params.length === 1 ? "" : "s"}` : ""}`,
      fields: [
        { label: "Host", value: u.hostname },
        { label: "Path", value: truncate(u.pathname, 80) },
        ...(params.length ? [{ label: "Parameters", value: truncate(params.join(", "), 120) }] : []),
      ],
      tools: encoded ? ["url-parser", "url-encoder"] : ["url-parser"],
    };
  } catch {
    return null;
  }
}

function detectPercentEncoded(s: string): Detection | null {
  if (!/%[0-9a-f]{2}/i.test(s) || /^https?:/i.test(s)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return null;
  }
  if (decoded === s) return null;
  return {
    id: "percent-encoded",
    label: "URL-encoded text",
    confidence: "high",
    summary: truncate(decoded, 100),
    fields: [{ label: "Decoded", value: truncate(decoded, 300) }],
    tools: ["url-encoder"],
  };
}

function detectPermissions(s: string): Detection | null {
  if (/^[d-]?([r-][w-][xsStT-]){3}$/.test(s)) {
    return { id: "chmod-symbolic", label: "Unix permissions (symbolic)", confidence: "high", summary: "Convert to octal (e.g. 755)", fields: [], tools: ["chmod-calculator"] };
  }
  if (/^[0-7]{3,4}$/.test(s)) {
    const digits = s.slice(-3).split("").map(Number);
    const sym = digits.map((d) => (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-")).join("");
    return { id: "chmod-octal", label: "Unix permissions (octal)?", confidence: "medium", summary: `chmod ${s} = ${sym}`, fields: [{ label: "Symbolic", value: sym }], tools: ["chmod-calculator"] };
  }
  return null;
}

function detectSemver(s: string): Detection | null {
  if (/\d+\.\d+\.\d+\.\d+/.test(s)) return null; // IPv4 addresses, not versions
  if (/^(\^|~|>=?|<=?|=)\s*v?\d+(\.\d+){0,2}/.test(s) || /\d+\.\d+\.\d+\s*(\|\||-\s)/.test(s)) {
    return { id: "semver-range", label: "npm version range", confidence: "high", summary: "See exactly which versions it allows", fields: [], tools: ["semver-calculator"] };
  }
  if (/^v?\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(s)) {
    return { id: "semver", label: "Semantic version", confidence: "medium", summary: "Compare it or preview the next bump", fields: [], tools: ["semver-calculator"] };
  }
  return null;
}

function detectRegex(s: string): Detection | null {
  if (!/^\/.+\/[dgimsuyv]*$/.test(s)) return null;
  try {
    const body = s.slice(1, s.lastIndexOf("/"));
    new RegExp(body);
    return { id: "regex", label: "Regular expression", confidence: "medium", summary: "Test it against sample text", fields: [], tools: ["regex-tester"] };
  } catch {
    return null;
  }
}

function detectCard(s: string): Detection | null {
  const digits = s.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnIsValid(digits)) return null;
  const network = detectCardNetwork(digits);
  return {
    id: "card",
    label: "Payment card number",
    confidence: "medium",
    summary: `Passes the Luhn check${network ? ` · ${network.name}` : ""}`,
    fields: [],
    tools: ["credit-card-test-generator"],
    warning: "Never paste a real card number into a website. Use test numbers for development.",
  };
}

function detectIban(s: string): Detection | null {
  const compact = s.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return null;
  const v = validateIban(compact);
  return {
    id: "iban",
    label: "IBAN",
    confidence: "high",
    summary: v.valid ? "Valid MOD-97 checksum" : "Checksum doesn't validate",
    fields: [],
    tools: ["iban-validator"],
  };
}

function detectHash(s: string): Detection | null {
  if (!/^[0-9a-f]+$/i.test(s)) return null;
  const kinds: Record<number, string> = { 32: "MD5", 40: "SHA-1", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" };
  const kind = kinds[s.length];
  if (!kind) return null;
  return {
    id: "hash",
    label: `${kind} hash?`,
    confidence: "medium",
    summary: `${s.length} hex characters — the length of a ${kind} digest`,
    fields: [],
    tools: ["hash-generator"],
  };
}

function detectBase64(s: string): Detection | null {
  // Base64 is often wrapped at line breaks, but never contains spaces mid-line
  if (/[ \t]/.test(s)) return null;
  const compact = s.replace(/[\r\n]+/g, "");
  if (compact.length < 12 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(compact)) return null;
  if (/^[0-9a-f]+$/i.test(compact)) return null;
  const bytes = b64ToBytes(compact);
  if (!bytes || bytes.length < 6) return null;
  const text = utf8(bytes);
  const urlSafe = /[-_]/.test(compact);
  if (text && printableRatio(text) > 0.95) {
    return {
      id: "base64",
      label: urlSafe ? "Base64URL-encoded text" : "Base64-encoded text",
      confidence: "high",
      summary: truncate(text.replace(/\s+/g, " "), 100),
      fields: [{ label: "Decoded", value: truncate(text, 400) }],
      tools: ["base64"],
    };
  }
  if (compact.length >= 24 && compact.length % 4 === 0) {
    return {
      id: "base64-binary",
      label: "Base64 (binary data)?",
      confidence: "medium",
      summary: `${bytes.length} bytes of non-text data`,
      fields: [],
      tools: ["base64"],
    };
  }
  return null;
}

const ERROR_SIGNAL = /\b(error|exception|failed|failure|denied|refused|cannot|can't|unable|undefined is not|is not defined|not found|ERR!|ERESOLVE|ENOENT|EACCES|ECONNREFUSED|traceback|panic|fatal|segmentation|stack trace|status code \d{3}|HTTP\/[\d.]+ [45]\d\d|[45]\d\d (Bad|Not|Internal|Forbidden|Unauthorized|Service|Gateway|Too Many|Unsupported))/i;

function detectError(s: string, articles: ErrorArticleIndex[]): Detection | null {
  if (!ERROR_SIGNAL.test(s)) return null;
  const matches = matchError(s, articles).slice(0, 3);
  const firstLine = s.split("\n").find((l) => l.trim())?.trim() ?? s;
  const stack = /\n\s+at\s|\bline \d+|Traceback/.test(s);
  return {
    id: "error",
    label: stack ? "Error with stack trace" : "Error message",
    confidence: matches.length ? "high" : "medium",
    summary: truncate(firstLine, 120),
    fields: [],
    tools: Array.from(new Set(matches.map((m) => m.toolSlug).filter((t): t is string => Boolean(t)))),
    guides: matches.map((m) => ({ slug: m.slug, title: m.title })),
  };
}

// ─── entry point ──────────────────────────────────────────────────────────────

/** Returns what the input most likely is, best match first. Everything runs locally. */
export async function detectLocal(raw: string, articles: ErrorArticleIndex[] = []): Promise<Detection[]> {
  const s = raw.trim();
  if (!s) return [];

  const specific = [
    await detectPem(s),
    await detectSshKey(s),
    detectJwt(s),
    detectOtpauth(s),
    detectConnectionString(s),
    detectCurl(s),
    detectDockerRun(s),
    detectBcrypt(s),
    detectJson(s),
    detectEmailAuth(s),
    detectWorkflow(s),
    detectMarkup(s),
    detectSql(s),
    detectUserAgent(s),
    detectIds(s),
    detectIsoDate(s),
    detectTimestamp(s),
    detectCron(s),
    detectNetwork(s),
    detectColor(s),
    detectUrl(s),
    detectPercentEncoded(s),
    detectSemver(s),
    detectRegex(s),
    detectIban(s),
    detectCard(s),
    detectPermissions(s),
  ].filter((d): d is Detection => d !== null);

  const results = [...specific];
  // Generic guesses only when nothing specific explains the input
  if (!specific.some((d) => d.confidence === "high")) {
    const generic = [detectHash(s), detectBase64(s)].filter((d): d is Detection => d !== null);
    results.push(...generic);
  }
  // A pasted error is recognised alongside other matches (e.g. an error containing a URL)
  const err = detectError(s, articles);
  if (err && !results.some((d) => d.id === "json" || d.id === "x509")) results.unshift(err);

  return results.sort((a, b) => (a.confidence === b.confidence ? 0 : a.confidence === "high" ? -1 : 1));
}

/** True when the input reads like a natural-language question rather than data. */
export function looksLikeQuestion(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 8) return false;
  const words = s.split(/\s+/).length;
  return words >= 4 && /[a-z]{3,}\s+[a-z]{2,}\s+[a-z]{2,}/i.test(s) && !/^[[{<]/.test(s);
}
