export interface ParsedHeader {
  name: string;
  value: string;
  description: string | null;
}

const HEADER_DESCRIPTIONS: Record<string, string> = {
  "content-type": "The MIME type of the response body, and often a character encoding (e.g. text/html; charset=utf-8) — tells the client how to parse the body.",
  "content-length": "The size of the response body in bytes. If it doesn't match the actual body length, the client may truncate the response or hang waiting for more data.",
  "content-encoding": "How the body is compressed (gzip, br, deflate) — the client decompresses it before reading Content-Type. Absent means the body is sent as-is.",
  "content-disposition": "Whether the browser should display the response inline or prompt a download, and what filename to suggest (attachment; filename=\"report.pdf\").",
  "content-language": "The natural language(s) of the response body, e.g. en-US.",
  "cache-control": "Caching rules for this response — max-age (seconds until stale), no-store (never cache), no-cache (revalidate before use), private/public (who may cache it). The single most important header for controlling both browser and CDN caching.",
  "etag": "An opaque version identifier for this exact response body. On the next request, a client can send If-None-Match with this value — if unchanged, the server replies 304 Not Modified with no body, saving bandwidth.",
  "last-modified": "When the resource was last changed. Pairs with If-Modified-Since on later requests for the same 304-not-modified revalidation ETag enables, just based on a timestamp instead of a content hash.",
  "expires": "An absolute date after which the response is considered stale. Largely superseded by Cache-Control's max-age, which is relative and easier to reason about, but still respected when present.",
  "age": "How many seconds a cached response (usually from a CDN or proxy) has been sitting in that cache since it was fetched from the origin server.",
  "vary": "Which request headers affect the response body for this same URL — e.g. Vary: Accept-Encoding means a gzip'd and uncompressed response are cached separately. A cache that ignores Vary can serve the wrong variant to the wrong client.",
  "set-cookie": "Sets a cookie in the client. Can appear multiple times (one per cookie). Check the Secure, HttpOnly, and SameSite attributes — their absence is a common security review finding.",
  "cookie": "Cookies the client is sending back to the server (request header, not response — included here since raw header dumps often mix both directions).",
  "location": "Where to redirect to (used with 3xx status codes), or the URL of a newly created resource (used with 201 Created).",
  "referrer-policy": "How much of the referring page's URL is sent in the Referer header on outgoing requests/subresource loads — controls a real privacy/information leak, e.g. no-referrer vs. strict-origin-when-cross-origin.",
  "access-control-allow-origin": "Which origin(s) a CORS request is allowed to read this response from. * allows any origin (only safe for public, non-credentialed responses); a specific origin is required if Access-Control-Allow-Credentials is true.",
  "access-control-allow-credentials": "Whether the browser should expose the response to JS when the request was made with credentials (cookies, HTTP auth). Must be paired with a specific (non-*) Access-Control-Allow-Origin.",
  "access-control-allow-methods": "Which HTTP methods are allowed for cross-origin requests to this endpoint, returned in response to a CORS preflight (OPTIONS) request.",
  "access-control-allow-headers": "Which request headers a cross-origin request is allowed to send, returned in response to a CORS preflight request.",
  "strict-transport-security": "Tells the browser to only ever connect to this host over HTTPS for max-age seconds, even if the user types http://. Prevents an attacker from silently downgrading the connection.",
  "content-security-policy": "Restricts which sources scripts, styles, images, and other resources may load from — a major defense against XSS and data injection.",
  "x-frame-options": "Whether this page can be embedded in an <iframe> on another site (DENY/SAMEORIGIN) — prevents clickjacking. Mostly superseded by the CSP frame-ancestors directive, but still widely sent for older browser support.",
  "x-content-type-options": "Set to nosniff, this stops the browser from guessing a different content type than what Content-Type declares — prevents a non-script file being executed as script due to MIME sniffing.",
  "x-xss-protection": "A legacy header that toggled a browser's built-in reflected-XSS filter. Removed from modern browsers (Chrome, Edge) — Content-Security-Policy is the current defense. Safe to still send for old-browser compatibility, but has no effect anywhere that matters today.",
  "x-powered-by": "Often auto-set by frameworks (Express, ASP.NET) to advertise what's running the server. Worth removing — it gives an attacker a head start narrowing down which known vulnerabilities to try.",
  "server": "Identifies the web server software (nginx, Apache, cloud provider). Like X-Powered-By, more specific values give attackers more to work with, so many teams strip or genericize this in production.",
  "date": "The date and time the server generated this response, per the HTTP spec's own date format.",
  "connection": "Whether to keep the underlying TCP connection open for more requests (keep-alive) or close it after this response.",
  "transfer-encoding": "How the body is framed for transport — chunked means the body is sent in a series of chunks of unknown-in-advance total length, common for streamed responses.",
  "retry-after": "On a 429 (rate limited) or 503 (unavailable) response, how long to wait before retrying — either a number of seconds or an HTTP date.",
  "permissions-policy": "Enables or disables specific browser features (camera, geolocation, payment APIs) for this page and any iframes it embeds — reduces what a compromised or malicious embedded script could access.",
  "cross-origin-opener-policy": "Isolates this page's browsing context from cross-origin popups/openers it interacts with — required for certain powerful APIs (SharedArrayBuffer) and a defense against some cross-origin attacks.",
  "cross-origin-resource-policy": "Restricts which origins are allowed to load this resource at all (even outside a CORS context, e.g. via <img>, <script>) — a blunter, complementary control to CORS.",
  "www-authenticate": "Sent with a 401 response — tells the client which authentication scheme(s) (Basic, Bearer, Digest) the server accepts and any parameters needed to authenticate.",
  "authorization": "The credentials a client sends to authenticate a request (request header, included here since raw dumps often mix both directions) — e.g. Authorization: Bearer <token>.",
};

export function parseHeaders(raw: string): ParsedHeader[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedHeader[] = [];
  for (const line of lines) {
    if (/^HTTP\/\d/.test(line)) continue; // skip a leading status line, e.g. "HTTP/1.1 200 OK"
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result.push({ name, value, description: HEADER_DESCRIPTIONS[name.toLowerCase()] ?? null });
  }
  return result;
}
