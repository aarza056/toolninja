// Audits a Content-Security-Policy the way a browser would read it: what it actually restricts, which
// sources undo that, and which directives don't fall back to default-src.

export type CspSeverity = "high" | "medium" | "low" | "info";

export interface CspFinding {
  severity: CspSeverity;
  directive: string;
  title: string;
  detail: string;
  fix?: string;
}

export interface CspReport {
  policy: string;
  directives: { name: string; values: string[] }[];
  findings: CspFinding[];
  passes: string[];
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface CspOptions {
  /** The header was Content-Security-Policy-Report-Only: nothing is enforced */
  reportOnly?: boolean;
  /** The response also sends X-Frame-Options, which covers some of what frame-ancestors does */
  hasFrameOptions?: boolean;
}

const PENALTY: Record<CspSeverity, number> = { high: 25, medium: 10, low: 3, info: 0 };

const KNOWN = new Set([
  "default-src", "script-src", "script-src-elem", "script-src-attr", "style-src", "style-src-elem", "style-src-attr",
  "img-src", "font-src", "connect-src", "media-src", "object-src", "frame-src", "child-src", "worker-src", "manifest-src",
  "fenced-frame-src", "base-uri", "form-action", "frame-ancestors", "sandbox", "report-uri", "report-to",
  "upgrade-insecure-requests", "require-trusted-types-for", "trusted-types", "webrtc",
]);

const DEPRECATED: Record<string, string> = {
  "block-all-mixed-content": "Browsers now upgrade or block mixed content by default. Use upgrade-insecure-requests if you need it.",
  "plugin-types": "Removed from the standard. Use object-src 'none'.",
  referrer: "Removed from the standard. Use the Referrer-Policy header.",
  "reflected-xss": "Removed from the standard and ignored by browsers.",
  "prefetch-src": "Removed from the standard and ignored by current browsers.",
  "navigate-to": "Removed from the standard and never shipped widely.",
  "require-sri-for": "Never shipped widely, so it can't be relied on.",
};

// These hosts serve old libraries or JSONP endpoints, which a script injection can use to run its own code
const BYPASS_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com", "ajax.googleapis.com", "*.googleapis.com", "www.google.com", "*.google.com", "accounts.google.com", "*.cloudfront.net", "*.herokuapp.com", "*.vercel.app", "*.netlify.app", "raw.githubusercontent.com", "*.github.io"];

const UNQUOTED_KEYWORDS = ["self", "none", "unsafe-inline", "unsafe-eval", "strict-dynamic", "unsafe-hashes", "report-sample", "wasm-unsafe-eval"];
const isNonce = (v: string) => /^'nonce-/.test(v);
const isHash = (v: string) => /^'sha(256|384|512)-/.test(v);
const hostOf = (v: string) => v.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

const gradeFor = (score: number): CspReport["grade"] => (score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F");

/** A header can carry several policies separated by commas, and a browser enforces them all */
export const splitPolicies = (header: string) =>
  header
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

export function checkCsp(policy: string, opts: CspOptions = {}): CspReport {
  const findings: CspFinding[] = [];
  const passes: string[] = [];
  const add = (severity: CspSeverity, directive: string, title: string, detail: string, fix?: string) => findings.push({ severity, directive, title, detail, fix });

  // A pasted header line is fine: drop its name
  const clean = policy.trim().replace(/^content-security-policy(-report-only)?\s*:\s*/i, "");

  const directives: { name: string; values: string[] }[] = [];
  const map: Record<string, string[]> = {};
  clean
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [rawName, ...values] = part.split(/\s+/);
      const name = rawName.toLowerCase();
      if (map[name]) {
        add("medium", name, `${name} appears twice`, "Browsers use the first one and ignore the rest, so the later values do nothing.", "Combine the values into one directive.");
        return;
      }
      map[name] = values.map((v) => (/^'/.test(v) && !isNonce(v) && !isHash(v) ? v.toLowerCase() : v));
      directives.push({ name, values });
    });
  const has = (name: string) => Object.prototype.hasOwnProperty.call(map, name);

  if (!directives.length) {
    add("high", "policy", "The policy is empty", "No directives means nothing is restricted.");
    return { policy: clean, directives, findings, passes, score: 0, grade: "F" };
  }

  if (opts.reportOnly) add("high", "policy", "Report-only: nothing is blocked", "Content-Security-Policy-Report-Only only reports violations, so this policy gives no protection yet.", "Send it as Content-Security-Policy once the reports are clean.");

  // Mistakes that apply to any directive
  directives.forEach(({ name }) => {
    const values = map[name];
    if (DEPRECATED[name]) add("info", name, `${name} is obsolete`, DEPRECATED[name]);
    else if (!KNOWN.has(name)) add("low", name, `Unknown directive: ${name}`, "Browsers ignore directives they don't recognize. Check the spelling.");
    if (name === "sandbox" || name === "report-uri" || name === "report-to" || name === "require-trusted-types-for" || name === "trusted-types") return;
    values.forEach((v) => {
      const lower = v.toLowerCase();
      if (UNQUOTED_KEYWORDS.includes(lower)) add("medium", name, `${v} needs single quotes`, `Without quotes a browser reads ${v} as a host name, so it doesn't mean what you intended.`, `Write '${lower}'.`);
      else if (/^(nonce-|sha(256|384|512)-)/i.test(v)) add("medium", name, "A nonce or hash needs single quotes", `Browsers read ${v.slice(0, 24)}… as a host name without the quotes, so it never matches.`, `Write '${v}'.`);
    });
    if (values.includes("'none'") && values.length > 1) add("low", name, "'none' is ignored here", "'none' only counts when it's the only value. With other sources present, a browser ignores it.", `Remove 'none' or remove the other sources from ${name}.`);
  });

  // ── Scripts ────────────────────────────────────────────────────────────────
  const scriptName = has("script-src") ? "script-src" : has("default-src") ? "default-src" : null;
  if (!scriptName) {
    add("high", "script-src", "Scripts aren't restricted", "There's no script-src and no default-src to fall back on, so scripts can load from anywhere and inline scripts run. CSP's main protection against XSS isn't in use.", "Add script-src 'self', or a nonce-based policy.");
  } else {
    const via = scriptName === "default-src" ? " (script-src falls back to default-src)" : "";
    const src = map[scriptName];
    const lower = src.map((v) => v.toLowerCase());
    const nonces = src.filter(isNonce);
    const hashes = src.filter(isHash);
    const strict = lower.includes("'strict-dynamic'");
    const keyed = nonces.length > 0 || hashes.length > 0;
    let safe = true;

    if (lower.includes("'unsafe-inline'")) {
      if (keyed || strict) add("info", scriptName, "'unsafe-inline' is ignored here", "Browsers ignore 'unsafe-inline' when a nonce, hash or 'strict-dynamic' is present. It's only there as a fallback for very old browsers.");
      else {
        safe = false;
        add("high", scriptName, `'unsafe-inline' allows inline scripts${via}`, "Injected <script> tags and onclick-style handlers will run, which is exactly the attack CSP exists to stop.", "Use nonces or hashes for the inline scripts you need, and remove 'unsafe-inline'.");
      }
    }
    if (lower.includes("'unsafe-eval'")) {
      safe = false;
      add("medium", scriptName, `'unsafe-eval' allows eval()${via}`, "eval(), new Function() and string timers can turn injected text into running code.", "Remove it if your dependencies allow. For WebAssembly only, 'wasm-unsafe-eval' is enough.");
    }
    if (strict && !keyed) {
      add("medium", scriptName, "'strict-dynamic' has nothing to start from", "It passes trust on from a script that has a nonce or hash. With neither here, no script can load.", "Add a per-response nonce, or a hash of your loader script.");
    }
    if (!strict) {
      lower.forEach((v) => {
        if (v === "*") {
          safe = false;
          add("high", scriptName, `* allows scripts from any site${via}`, "An attacker can load a script from a server they control.", "List the specific hosts you load from, or use nonces.");
        } else if (v === "https:" || v === "http:") {
          safe = false;
          add("high", scriptName, `${v} allows scripts from any ${v === "https:" ? "HTTPS " : ""}site${via}`, "Any site on that scheme qualifies, including one an attacker runs.", "List specific hosts, or use nonces.");
        } else if (v === "data:") {
          safe = false;
          add("high", scriptName, `data: allows inline code as a script URL${via}`, "<script src=\"data:text/javascript,…\"> runs whatever the URL holds, so this is as open as 'unsafe-inline'.", "Remove data: from script sources.");
        } else if (v === "blob:") {
          add("medium", scriptName, `blob: allows generated scripts${via}`, "A script that can already run can create new code from a blob URL.", "Remove it unless a library you use needs it.");
        } else if (/^http:\/\//.test(v)) {
          safe = false;
          add("high", scriptName, `${v} loads scripts over plain HTTP${via}`, "Anyone on the network path can change the script in transit.", "Use https:// or remove it.");
        } else if (BYPASS_HOSTS.includes(hostOf(v))) {
          add("medium", scriptName, `${hostOf(v)} can be used to get around this policy${via}`, "Shared hosts like this serve old libraries, other people's files or JSONP endpoints, and an injected tag can load any of them.", "Pin to the exact file path, or use nonces with 'strict-dynamic'.");
        } else if (/^(https?:\/\/)?\*\./.test(v)) {
          add("low", scriptName, `${v} trusts every subdomain${via}`, "A forgotten or user-content subdomain could then serve scripts.", "List the exact subdomains you load from.");
        }
      });
    } else if (keyed) {
      passes.push("Scripts are controlled by a nonce or hash with 'strict-dynamic', the approach browsers and Google's CSP guidance favor.");
    }

    nonces.forEach((n) => {
      const value = n.slice(7, -1);
      if (value.length < 22) add("medium", scriptName, "This nonce is too short", `The CSP spec asks for at least 128 bits of randomness, about 22 Base64 characters. “${value}” has ${value.length}.`, "Generate 16 or more random bytes for each response and Base64-encode them.");
    });
    if (nonces.length) add("info", scriptName, "A nonce must change on every response", "A check of one response can't see this. Reload the page and confirm the value changes, or an attacker can reuse it.");

    if (safe && !strict && !lower.includes("'none'")) passes.push(`${scriptName} doesn't allow inline scripts or arbitrary hosts.`);
    if (lower.length === 1 && lower[0] === "'none'") passes.push(`${scriptName} blocks all scripts.`);
  }
  // Inline event handlers and style attributes have their own directives that override the rest
  if (map["script-src-attr"]?.some((v) => v.toLowerCase() === "'unsafe-inline'")) add("high", "script-src-attr", "Inline event handlers are allowed", "onclick= and similar attributes run, so an injected attribute can execute code.", "Move handlers to addEventListener and set script-src-attr 'none'.");
  if (map["script-src-elem"]?.some((v) => v.toLowerCase() === "'unsafe-inline'")) add("high", "script-src-elem", "Inline <script> elements are allowed", "Injected script tags run.", "Use nonces or hashes.");

  // ── Everything without a useful fallback ───────────────────────────────────
  if (!has("default-src")) add("medium", "default-src", "No default-src", "Anything without its own directive (images, fonts, connections, media, frames) can load from anywhere.", "Add default-src 'self' and open up only what you need.");
  else if (map["default-src"].some((v) => ["*", "https:", "http:"].includes(v.toLowerCase()))) add("medium", "default-src", "default-src is very broad", "Every directive you haven't set falls back to this, so those resource types can load from anywhere.", "Use default-src 'self' and open up specific directives.");
  else passes.push("default-src gives other resource types a restrictive fallback.");

  const object = map["object-src"];
  if (object) {
    if (object.length === 1 && object[0].toLowerCase() === "'none'") passes.push("object-src 'none' blocks <object> and <embed>.");
    else add("medium", "object-src", "object-src allows plugin content", "<object> and <embed> can load content that may run script in your page's origin.", "Set object-src 'none' unless you truly embed these.");
  } else if (has("default-src") && map["default-src"].length === 1 && map["default-src"][0].toLowerCase() === "'none'") {
    passes.push("object-src inherits default-src 'none'.");
  } else {
    add(has("default-src") ? "low" : "medium", "object-src", "object-src isn't set to 'none'", has("default-src") ? "It falls back to default-src, so <object> and <embed> can load from those sources." : "Nothing restricts <object> and <embed>, which can load active content.", "Add object-src 'none'.");
  }

  const base = map["base-uri"];
  if (!base) add("medium", "base-uri", "No base-uri", "It doesn't fall back to default-src. An injected <base> tag can point every relative script URL at an attacker's server, and that can defeat a nonce-based policy.", "Add base-uri 'none', or 'self' if you use <base>.");
  else if (base.includes("*")) add("medium", "base-uri", "base-uri allows any site", "An injected <base> tag can redirect relative URLs anywhere.", "Use base-uri 'none' or 'self'.");
  else passes.push("base-uri stops an injected <base> tag from redirecting your scripts.");

  const frames = map["frame-ancestors"];
  if (!frames) {
    if (opts.hasFrameOptions) add("low", "frame-ancestors", "No frame-ancestors", "X-Frame-Options is covering clickjacking for now, but frame-ancestors is the modern control and can allow specific sites.", "Add frame-ancestors 'self' or 'none'.");
    else add("medium", "frame-ancestors", "No frame-ancestors", "It doesn't fall back to default-src. Any site can put your page in a frame, which allows clickjacking.", "Add frame-ancestors 'self' or 'none'.");
  } else if (frames.some((v) => ["*", "https:", "http:"].includes(v.toLowerCase()))) {
    add("medium", "frame-ancestors", "Any site can frame this page", "That leaves it open to clickjacking.", "List the sites allowed to frame you, or use 'self'.");
  } else {
    passes.push("frame-ancestors controls who can frame this page.");
  }

  const form = map["form-action"];
  if (!form) add("low", "form-action", "No form-action", "It doesn't fall back to default-src, so an injected or modified form could post what people type to another site.", "Add form-action 'self'.");
  else if (form.includes("*")) add("low", "form-action", "form-action allows any site", "A form can post to anywhere.", "List the destinations you actually use.");
  else passes.push("form-action limits where forms can send data.");

  // ── Softer points ──────────────────────────────────────────────────────────
  const styleName = has("style-src") ? "style-src" : has("default-src") ? "default-src" : null;
  if (styleName && map[styleName].some((v) => v.toLowerCase() === "'unsafe-inline'") && scriptName !== styleName) {
    add("low", styleName, "'unsafe-inline' allows inline styles", "Much less dangerous than for scripts and very common, but injected CSS can still alter pages and leak some data.", "Use nonces for <style> tags if your framework allows.");
  }
  (["img-src", "connect-src", "font-src", "media-src", "frame-src"] as const).forEach((name) => {
    if (map[name]?.includes("*")) add("low", name, `${name} allows any site`, name === "connect-src" ? "Injected code can send data to any server." : "Content of this type can load from anywhere.", "List the hosts you use.");
  });
  if (!has("report-to") && !has("report-uri")) add("info", "report-to", "No violation reporting", "You won't hear about blocked resources or attempted attacks. It's optional.", "Add report-to with a Reporting-Endpoints header, plus report-uri for browsers that don't support it yet.");

  const penalty = findings.reduce((n, f) => n + PENALTY[f.severity], 0);
  const score = Math.max(0, 100 - penalty);
  const order: CspSeverity[] = ["high", "medium", "low", "info"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  return { policy: clean, directives, findings, passes, score, grade: gradeFor(score) };
}
