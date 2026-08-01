export interface CspDirectiveMeta {
  key: string;
  label: string;
  desc: string;
}

export const CSP_DIRECTIVES: CspDirectiveMeta[] = [
  { key: "default-src", label: "Default Source", desc: "Fallback for any fetch directive not explicitly set" },
  { key: "script-src", label: "Script Source", desc: "Valid sources for JavaScript" },
  { key: "style-src", label: "Style Source", desc: "Valid sources for stylesheets" },
  { key: "img-src", label: "Image Source", desc: "Valid sources for images" },
  { key: "font-src", label: "Font Source", desc: "Valid sources for fonts" },
  { key: "connect-src", label: "Connect Source", desc: "Valid targets for fetch, XHR, WebSocket" },
  { key: "frame-src", label: "Frame Source", desc: "Valid sources for iframes" },
  { key: "frame-ancestors", label: "Frame Ancestors", desc: "Who is allowed to embed this page in a frame" },
  { key: "object-src", label: "Object Source", desc: "Valid sources for <object>, <embed>, <applet>" },
  { key: "base-uri", label: "Base URI", desc: "Valid URLs for the <base> element" },
  { key: "form-action", label: "Form Action", desc: "Valid targets for form submissions" },
];

export const CSP_KEYWORDS = ["'self'", "'none'", "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'"];

export function buildCsp(directives: Record<string, string>, upgradeInsecure: boolean): string {
  const parts: string[] = [];
  for (const d of CSP_DIRECTIVES) {
    const value = directives[d.key]?.trim();
    if (value) parts.push(`${d.key} ${value}`);
  }
  if (upgradeInsecure) parts.push("upgrade-insecure-requests");
  return parts.join("; ") + (parts.length ? ";" : "");
}

export function parseCsp(csp: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  csp
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [key, ...values] = part.split(/\s+/);
      if (key) result[key] = values;
    });
  return result;
}

export interface CspWarning {
  severity: "high" | "medium" | "low";
  message: string;
}

export function analyzeCsp(csp: string): CspWarning[] {
  const warnings: CspWarning[] = [];
  const d = parseCsp(csp);

  if (d["script-src"]?.includes("'unsafe-inline'")) {
    warnings.push({
      severity: "high",
      message: "script-src allows 'unsafe-inline' — inline <script> tags and inline event handlers bypass CSP's main defense against XSS.",
    });
  }
  if (d["script-src"]?.includes("'unsafe-eval'")) {
    warnings.push({
      severity: "high",
      message: "script-src allows 'unsafe-eval' — eval(), Function(), and similar dynamic code execution are enabled, a common XSS escalation path.",
    });
  }
  if (d["script-src"]?.includes("*")) {
    warnings.push({
      severity: "high",
      message: "script-src allows '*' — scripts can be loaded from any origin on the internet, effectively disabling this protection.",
    });
  }
  if (!d["default-src"] && !d["script-src"]) {
    warnings.push({
      severity: "medium",
      message: "No default-src or script-src is set — browsers fall back to allowing scripts from anywhere.",
    });
  }
  if (!d["object-src"] || !d["object-src"].includes("'none'")) {
    warnings.push({
      severity: "low",
      message: "object-src is not set to 'none' — consider blocking <object>/<embed>/<applet> entirely unless your site actually needs them.",
    });
  }
  if (!d["frame-ancestors"]) {
    warnings.push({
      severity: "low",
      message: "frame-ancestors is not set — add it (e.g. 'self') to prevent your site being embedded in a clickjacking iframe.",
    });
  }
  if (d["style-src"]?.includes("'unsafe-inline'")) {
    warnings.push({
      severity: "medium",
      message: "style-src allows 'unsafe-inline' — inline style attributes and <style> tags bypass CSS-based injection protection.",
    });
  }
  if (!d["base-uri"]) {
    warnings.push({
      severity: "low",
      message: "base-uri is not set — without it, an injected <base> tag could redirect all relative URLs on the page to an attacker's domain.",
    });
  }

  return warnings;
}
