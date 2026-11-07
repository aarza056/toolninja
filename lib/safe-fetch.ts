import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import http from "node:http";
import https from "node:https";

// Fetches the response headers of a public web page for the Security Headers Checker, without letting
// a visitor point our server at anything internal (SSRF):
//   - only http/https on the default ports, no credentials in the URL
//   - every address the hostname resolves to must be public; the connection is then pinned to the
//     checked address, so a second DNS answer can't swap in a private one (DNS rebinding)
//   - redirects are followed by hand, each hop checked the same way, at most 5
//   - the header check reads only the status line and headers; the sitemap crawler (fetchPage) also
//     reads the body of successful responses of an accepted type, up to a size limit

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as [string, number][]) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["2001:db8::", 32], ["100::", 64],
] as [string, number][]) blocked.addSubnet(net, prefix, "ipv6");

/** An IPv4 address carried inside an IPv6 one (::ffff:a.b.c.d, NAT64 64:ff9b::/96, 6to4 2002::/16) */
function embeddedV4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = /^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (dotted) return dotted[1];
  const hex = /^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
  const sixToFour = /^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4}):/.exec(lower);
  const m = hex ?? sixToFour;
  if (!m) return null;
  const a = parseInt(m[1], 16);
  const b = parseInt(m[2], 16);
  return [a >> 8, a & 255, b >> 8, b & 255].join(".");
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blocked.check(ip, "ipv4");
  if (family === 6) {
    const v4 = embeddedV4(ip);
    if (v4) return isPublicAddress(v4);
    return !blocked.check(ip, "ipv6");
  }
  return false;
}

type Resolved = { address: string; family: 4 | 6 };

export async function resolvePublic(hostname: string): Promise<Resolved | { error: string }> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host)) return isPublicAddress(host) ? { address: host, family: isIP(host) as 4 | 6 } : { error: "That address is private or reserved." };
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(host)) return { error: "Enter a public domain name." };
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    return { error: `Couldn't resolve ${host} — check the spelling.` };
  }
  if (!addrs.length) return { error: `${host} has no address.` };
  // Refuse the whole name if any answer is private, so we can't be steered to it on a retry
  if (addrs.some((a) => !isPublicAddress(a.address))) return { error: `${host} points to a private or reserved address.` };
  return { address: addrs[0].address, family: addrs[0].family === 6 ? 6 : 4 };
}

export interface FetchedHeaders {
  finalUrl: string;
  status: number;
  statusText: string;
  /** Header lines in the order the server sent them, original casing */
  headers: [string, string][];
  /** Each redirect followed: where it pointed from, and its status */
  chain: { url: string; status: number }[];
  body?: string;
  /** The body hit the size limit */
  truncated?: boolean;
  /** Stopped at a redirect to another site */
  leftSite?: boolean;
}

interface RequestOptions {
  userAgent: string;
  /** Read the body too, up to this many bytes, if `wantBody` says so; otherwise only headers are read */
  maxBytes?: number;
  wantBody?: (status: number, headers: [string, string][]) => boolean;
}

const HEADER_CHECK_UA = "ToolNinja-HeaderCheck/1.0 (+https://toolninja.io/tools/security-headers-checker)";

function requestOnce(url: URL, target: Resolved, timeoutMs: number, opts: RequestOptions): Promise<{ status: number; statusText: string; headers: [string, string][]; body?: string; truncated?: boolean }> {
  const mod = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      {
        host: url.hostname,
        servername: url.hostname.replace(/^\[|\]$/g, ""),
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { "User-Agent": opts.userAgent, Accept: "text/html,*/*" },
        // Connect to the address we already checked, whatever DNS says now
        lookup: ((_host: string, opts: { all?: boolean }, cb: (...args: unknown[]) => void) =>
          opts?.all ? cb(null, [{ address: target.address, family: target.family }]) : cb(null, target.address, target.family)) as never,
        timeout: timeoutMs,
      },
      (res) => {
        const raw = res.rawHeaders;
        const headers: [string, string][] = [];
        for (let i = 0; i + 1 < raw.length; i += 2) headers.push([raw[i], raw[i + 1]]);
        const base = { status: res.statusCode ?? 0, statusText: res.statusMessage ?? "", headers };
        if (!opts.maxBytes || !opts.wantBody?.(base.status, headers)) {
          resolve(base);
          res.destroy(); // headers are all we need
          return;
        }
        // Stop reading at the size limit, so a huge or endless response can't tie up the function
        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = (truncated: boolean) => {
          if (done) return;
          done = true;
          resolve({ ...base, body: Buffer.concat(chunks).toString("utf8"), truncated });
          res.destroy();
        };
        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          size += chunk.length;
          if (size >= opts.maxBytes!) finish(true);
        });
        res.on("end", () => finish(false));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("The site took too long to respond.")));
    req.on("error", reject);
    req.end();
  });
}

async function fetchFollowing(input: string, opts: RequestOptions, maxRedirects: number, stayOn?: (host: string) => boolean): Promise<{ ok: true; result: FetchedHeaders } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return { ok: false, error: "That isn't a valid URL." };
  }
  const chain: { url: string; status: number }[] = [];
  const started = Date.now();
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Only http and https URLs can be checked." };
    if (url.username || url.password) return { ok: false, error: "Remove the username and password from the URL." };
    if (url.port && !["80", "443"].includes(url.port)) return { ok: false, error: "Only the standard ports (80 and 443) can be checked." };
    const target = await resolvePublic(url.hostname);
    if ("error" in target) return { ok: false, error: target.error };
    let res;
    try {
      res = await requestOnce(url, target, Math.max(1000, 9000 - (Date.now() - started)), opts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "request failed";
      return { ok: false, error: /certificate|SSL|TLS/i.test(msg) ? `TLS error: ${msg}` : `Couldn't connect: ${msg}` };
    }
    const location = res.headers.find(([k]) => k.toLowerCase() === "location")?.[1];
    if (res.status >= 300 && res.status < 400 && location && hop < maxRedirects) {
      chain.push({ url: url.href, status: res.status });
      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        return { ok: false, error: `The redirect to “${location}” isn't a valid URL.` };
      }
      // The caller decides whether to leave the current site; the redirect itself is the answer then
      if (stayOn && !stayOn(next.hostname)) {
        return { ok: true, result: { finalUrl: next.href, status: res.status, statusText: res.statusText, headers: res.headers, chain, leftSite: true } };
      }
      url = next;
      continue;
    }
    return { ok: true, result: { finalUrl: url.href, status: res.status, statusText: res.statusText, headers: res.headers, chain, body: res.body, truncated: res.truncated } };
  }
  return { ok: false, error: `More than ${maxRedirects} redirects.` };
}

export const fetchHeaders = (input: string, maxRedirects = 5) => fetchFollowing(input, { userAgent: HEADER_CHECK_UA }, maxRedirects);

/**
 * A public page's body (for the sitemap crawler), read only when it's a successful response of an
 * accepted type and only up to `maxBytes`. With `stayOn`, a redirect to another site isn't followed.
 */
export const fetchPage = (input: string, opts: { userAgent: string; maxBytes: number; accept: RegExp; stayOn?: (host: string) => boolean }) =>
  fetchFollowing(
    input,
    {
      userAgent: opts.userAgent,
      maxBytes: opts.maxBytes,
      wantBody: (status, headers) => status >= 200 && status < 300 && opts.accept.test(headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? ""),
    },
    5,
    opts.stayOn
  );
