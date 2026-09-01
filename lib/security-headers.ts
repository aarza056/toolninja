export type HeaderSeverity = "critical" | "recommended" | "info";

export interface HeaderCheck {
  name: string;
  severity: HeaderSeverity;
  present: boolean;
  value?: string;
  message: string;
}

interface HeaderRule {
  name: string;
  severity: HeaderSeverity;
  missingMessage: string;
  evaluate?: (value: string) => string | null; // returns a warning message, or null if fine
}

const RULES: HeaderRule[] = [
  {
    name: "strict-transport-security",
    severity: "critical",
    missingMessage: "Without HSTS, a user's first visit (or any visit over a compromised network) can be silently downgraded to plain HTTP by an attacker in the middle.",
    evaluate: (v) => {
      const maxAgeMatch = v.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge < 15552000) return "max-age is under 180 days — most guidance recommends at least 15552000 (180 days), and 31536000 (1 year) with includeSubDomains for HSTS preload eligibility.";
      return null;
    },
  },
  {
    name: "x-frame-options",
    severity: "recommended",
    missingMessage: "Without this (or a frame-ancestors CSP directive), the page can be embedded in an <iframe> on another site, enabling clickjacking attacks.",
    evaluate: (v) => {
      const val = v.trim().toUpperCase();
      if (val !== "DENY" && val !== "SAMEORIGIN" && !val.startsWith("ALLOW-FROM")) {
        return `"${v}" is not a standard value — expected DENY, SAMEORIGIN, or ALLOW-FROM.`;
      }
      return null;
    },
  },
  {
    name: "x-content-type-options",
    severity: "recommended",
    missingMessage: "Without this, older browsers may MIME-sniff a response into a different content type than declared — e.g. treating an uploaded file as executable script.",
    evaluate: (v) => (v.trim().toLowerCase() !== "nosniff" ? `Expected "nosniff", got "${v}".` : null),
  },
  {
    name: "content-security-policy",
    severity: "critical",
    missingMessage: "No CSP means the browser enforces no restriction on which scripts, styles, or resources the page can load — a major XSS mitigation is simply absent.",
    evaluate: (v) => {
      if (/unsafe-inline/i.test(v) && /script-src/i.test(v)) {
        return "script-src includes 'unsafe-inline', which defeats most of CSP's XSS protection — consider a nonce or hash instead.";
      }
      return null;
    },
  },
  {
    name: "referrer-policy",
    severity: "recommended",
    missingMessage: "Without this, the browser's default referrer behavior may leak the full originating URL (including query strings) to third-party sites linked from this page.",
    evaluate: (v) => {
      const safe = ["no-referrer", "strict-origin", "strict-origin-when-cross-origin", "same-origin"];
      if (!safe.includes(v.trim().toLowerCase())) {
        return `"${v}" leaks more referrer information than the commonly recommended strict-origin-when-cross-origin.`;
      }
      return null;
    },
  },
  {
    name: "permissions-policy",
    severity: "info",
    missingMessage: "Without this, the page and any embedded third-party frames retain default access to browser features like camera, microphone, and geolocation.",
  },
  {
    name: "x-xss-protection",
    severity: "info",
    missingMessage: "Deprecated and ignored by modern browsers in favor of CSP — not having it is not a real issue, but if present it should be disabled (0) rather than left in an inconsistent state, since the old XSS filter it controlled had its own exploitable bugs.",
    evaluate: (v) => (v.trim() !== "0" ? "Modern guidance is to explicitly set this to 0 (disabled) and rely on CSP instead — the legacy XSS auditor this controls has itself been a source of vulnerabilities in the past." : null),
  },
  {
    name: "cross-origin-opener-policy",
    severity: "info",
    missingMessage: "Without COOP, this page's window can be accessed by a popup or opener from another origin, which can enable certain cross-origin attacks (e.g. Spectre-style side channels).",
  },
  {
    name: "cross-origin-resource-policy",
    severity: "info",
    missingMessage: "Without CORP, this resource can be loaded cross-origin by other sites (e.g. embedded as an image or script), which may not be intended for sensitive responses.",
  },
];

/** Parses a block of raw HTTP response headers (as copy-pasted from browser DevTools or curl -I)
 * into a lowercase-keyed map. Tolerant of the "Header: value" and "Header : value" forms, and
 * ignores the leading HTTP status line if present. */
export function parseRawHeaders(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^HTTP\/\d/i.test(trimmed)) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key) map.set(key, value);
  }
  return map;
}

export interface SecurityHeaderReport {
  checks: HeaderCheck[];
  score: number; // 0-100
  criticalMissing: number;
}

export function analyzeHeaders(raw: string): SecurityHeaderReport {
  const headers = parseRawHeaders(raw);
  const checks: HeaderCheck[] = [];

  for (const rule of RULES) {
    const value = headers.get(rule.name);
    if (value === undefined) {
      checks.push({ name: rule.name, severity: rule.severity, present: false, message: rule.missingMessage });
      continue;
    }
    const warning = rule.evaluate?.(value) ?? null;
    checks.push({
      name: rule.name,
      severity: rule.severity,
      present: true,
      value,
      message: warning ?? "Present and looks correctly configured.",
    });
  }

  const weights: Record<HeaderSeverity, number> = { critical: 30, recommended: 15, info: 5 };
  const maxScore = RULES.reduce((sum, r) => sum + weights[r.severity], 0);
  let earned = 0;
  for (const check of checks) {
    const weight = weights[check.severity];
    if (check.present && check.message === "Present and looks correctly configured.") {
      earned += weight;
    } else if (check.present) {
      earned += weight * 0.5; // present but misconfigured — partial credit
    }
  }

  const criticalMissing = checks.filter((c) => c.severity === "critical" && !c.present).length;

  return {
    checks,
    score: Math.round((earned / maxScore) * 100),
    criticalMissing,
  };
}
