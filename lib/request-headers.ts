// What a server sees in a request: splits headers into what the client sent and what proxies added,
// and keeps secrets out of the response.

export interface SeenHeader {
  name: string;
  value: string;
  note?: string;
}

export interface RequestInspection {
  headers: SeenHeader[];
  /** Headers that suggest a proxy or CDN handled the request on its way here */
  proxySignals: SeenHeader[];
  /** Forwarding headers, which a host normally adds or rewrites itself */
  forwarding: SeenHeader[];
  /** Sent, but not shown */
  withheld: string[];
}

// Never echoed. Credentials are the caller's own, but they don't belong in a page or a log
const SECRET = new Set(["authorization", "proxy-authorization", "cookie", "x-api-key", "api-key", "x-auth-token", "x-csrf-token", "x-xsrf-token"]);
// Our host's internal headers: some hold signatures or tokens, and none are about the visitor's request
const INTERNAL = /^(x-vercel-|x-middleware-|x-invoke-|x-nextjs-|x-matched-path$|x-now-|next-)/;

const PROXY_SIGNALS: Record<string, string> = {
  via: "Added by proxies and gateways. The standard way for one to announce itself.",
  "proxy-connection": "A non-standard header older clients and proxies send.",
  "x-proxy-id": "Identifies a proxy server.",
  "x-proxyuser-ip": "The client's IP, added by a proxy (Google's proxies use this name).",
  "x-bluecoat-via": "Added by Blue Coat / Symantec proxies.",
  "x-forwarded-server": "The proxy server's own host name.",
  "x-forwarded-by": "The proxy that forwarded the request.",
  "x-originating-ip": "The client's IP, added by some proxies and mail gateways.",
  "x-remote-ip": "The client's IP, added by some proxies.",
  "x-client-ip": "The client's IP, added by some proxies.",
  "cf-connecting-ip": "The client's IP, added by Cloudflare.",
  "cf-ray": "A Cloudflare request id.",
  "true-client-ip": "The client's IP, added by Akamai or Cloudflare Enterprise.",
  "fastly-client-ip": "The client's IP, added by Fastly.",
  "x-azure-clientip": "The client's IP, added by Azure Front Door.",
  "x-amz-cf-id": "A CloudFront request id.",
};

const FORWARDING: Record<string, string> = {
  "x-forwarded-for": "The chain of client and proxy IPs. Our host overwrites what the client sends, so this shows what it saw.",
  "x-forwarded-host": "The host name the client originally asked for.",
  "x-forwarded-proto": "Whether the client connected with http or https.",
  "x-forwarded-port": "The port the client connected to.",
  "x-real-ip": "The client's IP, as set by the proxy in front of the app.",
  forwarded: "The standard form of the X-Forwarded-* headers (RFC 7239).",
};

const NOTES: Record<string, string> = {
  accept: "The response formats the client can handle.",
  "accept-encoding": "The compression the client understands.",
  "accept-language": "The client's preferred languages.",
  "cache-control": "How caches on the way should treat this request.",
  connection: "Whether to keep the connection open.",
  dnt: "The Do Not Track setting.",
  host: "The host name the request is for.",
  origin: "The site that started this request (sent for CORS and POST).",
  pragma: "An old cache control, kept for HTTP/1.0.",
  priority: "The client's hint about how urgent this request is.",
  referer: "The page that linked to this request (the misspelling is in the standard).",
  "sec-ch-ua": "Client hints: the browser brand and version.",
  "sec-ch-ua-mobile": "Client hints: whether this is a mobile browser.",
  "sec-ch-ua-platform": "Client hints: the operating system.",
  "sec-fetch-dest": "What the response will be used as.",
  "sec-fetch-mode": "The request's mode, such as cors or navigate.",
  "sec-fetch-site": "How the requesting site relates to this one.",
  "sec-gpc": "The Global Privacy Control setting.",
  "upgrade-insecure-requests": "The client prefers HTTPS.",
  "user-agent": "The client's own description of itself. Easy to change, so it proves nothing.",
};

export function inspectRequest(pairs: [string, string][]): RequestInspection {
  const headers: SeenHeader[] = [];
  const proxySignals: SeenHeader[] = [];
  const forwarding: SeenHeader[] = [];
  const withheld: string[] = [];
  pairs
    .map(([name, value]) => [name.toLowerCase(), value] as [string, string])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .forEach(([name, value]) => {
      if (INTERNAL.test(name)) return;
      if (SECRET.has(name)) {
        withheld.push(name);
        return;
      }
      if (PROXY_SIGNALS[name]) proxySignals.push({ name, value, note: PROXY_SIGNALS[name] });
      else if (FORWARDING[name]) forwarding.push({ name, value, note: FORWARDING[name] });
      else headers.push({ name, value, note: NOTES[name] });
    });
  return { headers, proxySignals, forwarding, withheld };
}
