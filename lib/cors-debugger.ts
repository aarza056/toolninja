const SIMPLE_METHODS = ["GET", "HEAD", "POST"];
const SIMPLE_HEADERS = ["accept", "accept-language", "content-language", "content-type"];
const SIMPLE_CONTENT_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];

export interface CorsCheckInput {
  origin: string;
  method: string;
  requestHeaders: string[];
  contentType: string;
  withCredentials: boolean;
  responseHeaders: Record<string, string>;
}

export interface CorsCheckItem {
  label: string;
  pass: boolean;
  detail: string;
}

export interface CorsCheckResult {
  needsPreflight: boolean;
  preflightReasons: string[];
  checks: CorsCheckItem[];
  verdict: "allowed" | "blocked";
}

function simplePreflightReasons(method: string, requestHeaders: string[], contentType: string): string[] {
  const reasons: string[] = [];
  if (!SIMPLE_METHODS.includes(method.toUpperCase())) {
    reasons.push(`Method ${method} is not a CORS-simple method (only GET, HEAD, and POST avoid a preflight).`);
  }
  for (const h of requestHeaders) {
    if (!SIMPLE_HEADERS.includes(h.toLowerCase())) {
      reasons.push(`Header "${h}" is not on the CORS-safelisted header list.`);
    }
  }
  if (contentType && !SIMPLE_CONTENT_TYPES.includes(contentType.toLowerCase().split(";")[0].trim())) {
    reasons.push(`Content-Type "${contentType}" isn't one of the three simple content types (application/x-www-form-urlencoded, multipart/form-data, text/plain).`);
  }
  return reasons;
}

/** Walks the same decision the browser itself makes for a cross-origin request: whether it needs
 * a preflight, then whether the response headers actually satisfy what's being asked of them.
 * Pass whichever response headers you actually received — for a preflighted request that's the
 * OPTIONS response; for a simple request it's the real response. */
export function checkCors(input: CorsCheckInput): CorsCheckResult {
  const responseHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.responseHeaders)) responseHeaders[k.toLowerCase()] = v;

  const preflightReasons = simplePreflightReasons(input.method, input.requestHeaders, input.contentType);
  const checks: CorsCheckItem[] = [];

  const acao = responseHeaders["access-control-allow-origin"];
  if (!acao) {
    checks.push({ label: "Access-Control-Allow-Origin", pass: false, detail: "No Access-Control-Allow-Origin header in the response at all — the browser blocks the request by default unless a server explicitly opts in." });
  } else if (acao === "*") {
    if (input.withCredentials) {
      checks.push({ label: "Access-Control-Allow-Origin", pass: false, detail: "Server sent \"*\", but credentials are included in this request. A wildcard origin is never allowed together with credentials — the server must echo back the exact origin instead." });
    } else {
      checks.push({ label: "Access-Control-Allow-Origin", pass: true, detail: "Wildcard \"*\" allows any origin (fine since no credentials are involved)." });
    }
  } else if (acao === input.origin) {
    checks.push({ label: "Access-Control-Allow-Origin", pass: true, detail: `Matches the request origin exactly (${input.origin}).` });
  } else {
    checks.push({ label: "Access-Control-Allow-Origin", pass: false, detail: `Server allows "${acao}", but the request's origin is "${input.origin}" — these must match exactly (no subdomain or protocol wildcarding).` });
  }

  if (input.withCredentials) {
    const acac = responseHeaders["access-control-allow-credentials"];
    checks.push({
      label: "Access-Control-Allow-Credentials",
      pass: acac === "true",
      detail: acac === "true"
        ? "Present and set to \"true\", as required whenever credentials are sent."
        : `Missing or not exactly "true" (got: ${acac ?? "nothing"}) — required because this request includes credentials (cookies or an Authorization header).`,
    });
  }

  if (preflightReasons.length > 0) {
    const acam = responseHeaders["access-control-allow-methods"];
    const allowedMethods = acam ? acam.split(",").map((s) => s.trim().toUpperCase()) : [];
    const methodOk = allowedMethods.includes(input.method.toUpperCase());
    checks.push({
      label: "Access-Control-Allow-Methods",
      pass: methodOk,
      detail: methodOk
        ? `${input.method} is listed.`
        : `${input.method} isn't in Access-Control-Allow-Methods (got: ${acam ?? "nothing"}).`,
    });

    const acah = responseHeaders["access-control-allow-headers"];
    const allowedHeaders = acah ? acah.split(",").map((s) => s.trim().toLowerCase()) : [];
    const missingHeaders = input.requestHeaders.filter(
      (h) => !SIMPLE_HEADERS.includes(h.toLowerCase()) && !allowedHeaders.includes(h.toLowerCase())
    );
    checks.push({
      label: "Access-Control-Allow-Headers",
      pass: missingHeaders.length === 0,
      detail: missingHeaders.length === 0
        ? "Every custom header this request sends is allowed."
        : `Not allowed: ${missingHeaders.join(", ")} — add them to Access-Control-Allow-Headers on the server.`,
    });
  }

  const verdict: CorsCheckResult["verdict"] = checks.every((c) => c.pass) ? "allowed" : "blocked";

  return { needsPreflight: preflightReasons.length > 0, preflightReasons, checks, verdict };
}
