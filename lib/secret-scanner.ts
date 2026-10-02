export type SecretSeverity = "critical" | "high" | "medium";

export interface SecretRule {
  name: string;
  severity: SecretSeverity;
  pattern: RegExp;
  remediation: string;
}

// A curated subset of the well-known, high-confidence patterns most secret scanners (Gitleaks,
// TruffleHog, GitHub's own secret scanning) ship by default — format-based detection, not a full
// entropy analyzer. Deliberately excludes Stripe's pk_live_/pk_test_ publishable keys: those are
// designed to be public and embedded in client-side code, so flagging them would be a false alarm.
export const SECRET_RULES: SecretRule[] = [
  {
    name: "AWS Access Key ID",
    severity: "critical",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    remediation: "Rotate this key in the AWS IAM console immediately, then move it to an environment variable or a secrets manager (AWS Secrets Manager, SSM Parameter Store) — never commit it.",
  },
  {
    name: "GitHub Personal Access Token",
    severity: "critical",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
    remediation: "Revoke this token on GitHub (Settings → Developer settings → Personal access tokens) and generate a new one. Store it as a CI secret or environment variable, not in code.",
  },
  {
    name: "GitHub Fine-Grained PAT",
    severity: "critical",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g,
    remediation: "Revoke this fine-grained token on GitHub and generate a replacement. These are scoped but still grant real repository access — treat exposure the same as a classic PAT.",
  },
  {
    name: "Stripe Secret Key",
    severity: "critical",
    pattern: /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{24,}\b/g,
    remediation: "Roll this key immediately in the Stripe Dashboard (Developers → API keys) — a live secret key grants full account access. Test keys are lower-stakes but should still be rotated and kept out of version control.",
  },
  {
    name: "Slack Webhook URL",
    severity: "high",
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/g,
    remediation: "Anyone with this URL can post to the channel it's wired to. Regenerate the webhook in Slack's App settings and store the new URL as an environment variable.",
  },
  {
    name: "Slack Token",
    severity: "critical",
    pattern: /\bxox[baprs]-[0-9A-Za-z-]+\b/g,
    remediation: "Revoke this token in your Slack app's OAuth settings and reinstall with a fresh token, stored outside version control.",
  },
  {
    name: "Google API Key",
    severity: "high",
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    remediation: "Restrict or regenerate this key in Google Cloud Console (APIs & Services → Credentials). Add API restrictions and HTTP referrer restrictions even for keys meant to be used client-side.",
  },
  {
    name: "npm Access Token",
    severity: "critical",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    remediation: "Revoke this token at npmjs.com (Access Tokens settings) — it can publish packages under your account. Use a scoped, short-lived token in CI instead of a long-lived one in code.",
  },
  {
    name: "SendGrid API Key",
    severity: "critical",
    pattern: /\bSG\.[A-Za-z0-9_\-.]{20,}\b/g,
    remediation: "Revoke this key in the SendGrid dashboard (Settings → API Keys) and issue a new one scoped to only the permissions your app actually needs.",
  },
  {
    name: "Twilio API Key SID",
    severity: "high",
    pattern: /\bSK[0-9a-fA-F]{32}\b/g,
    remediation: "Delete and regenerate this API key in the Twilio Console (Account → API keys & tokens).",
  },
  {
    name: "Private Key Block",
    severity: "critical",
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/g,
    remediation: "A private key in version control should be considered fully compromised — generate a new key pair, update every system that trusted the old public key, and revoke the old one.",
  },
  {
    name: "JWT-shaped token",
    severity: "medium",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    remediation: "JWTs are signed, not encrypted — anyone with this token can read its payload and use it until it expires. If it's a long-lived or non-expiring token, revoke and reissue it.",
  },
  {
    name: "Possible hardcoded secret (by variable name)",
    severity: "medium",
    pattern: /\b(secret|password|passwd|api[_-]?key|access[_-]?key|token)\s*[:=]\s*['"]([A-Za-z0-9+/=_\-]{16,})['"]/gi,
    remediation: "This looks like a secret-sounding variable assigned a literal string. If it's a real credential, move it to an environment variable (.env, excluded from git) or a secrets manager — if it's a placeholder or test fixture, ignore this finding.",
  },
];

export interface SecretFinding {
  rule: string;
  severity: SecretSeverity;
  match: string;
  line: number;
  remediation: string;
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

function redact(match: string): string {
  if (match.length <= 10) return match.slice(0, 2) + "…";
  return match.slice(0, 6) + "…" + match.slice(-4);
}

export function scanForSecrets(text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  for (const rule of SECRET_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text))) {
      const key = `${rule.name}:${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        rule: rule.name,
        severity: rule.severity,
        match: redact(m[0]),
        line: lineOf(text, m.index),
        remediation: rule.remediation,
      });
      if (m[0].length === 0) regex.lastIndex++; // guard against zero-length matches looping forever
    }
  }

  return findings.sort((a, b) => a.line - b.line);
}
