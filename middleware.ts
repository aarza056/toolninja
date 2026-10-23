import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";
import { OWNER_HEAD_SCRIPT } from "@/lib/owner";

// Guards /admin and /api/admin. Every admin page and action also re-checks the session on the server;
// this is the outer gate, and it keeps admin URLs out of search engines.
//
// It also gives /admin a strict, nonce-based Content-Security-Policy. Admin pages are rendered per
// request anyway, so a per-request nonce costs nothing there. Next.js reads the nonce from the
// request's CSP header and puts it on its own scripts; 'strict-dynamic' then trusts what those load.
// The root layout's one inline script (owner mode) is allowed by its hash. Public pages are
// statically generated and can't carry a per-request nonce — they keep the policy in next.config.mjs.
// The browser enforces both policies on /admin, so the stricter one wins.

let ownerScriptHash: Promise<string> | null = null;
function sha256Base64(text: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then((buf) => {
    let s = "";
    new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
  });
}

async function adminCsp(nonce: string): Promise<string> {
  ownerScriptHash ??= sha256Base64(OWNER_HEAD_SCRIPT);
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'sha256-${await ownerScriptHash}'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  const ok = isLogin || (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) !== null;
  const isPage = !pathname.startsWith("/api/");

  let res: NextResponse;
  let csp: string | null = null;
  if (ok && isPage) {
    const nonce = btoa(crypto.randomUUID());
    csp = await adminCsp(nonce);
    // The request header is how Next.js learns the nonce for its own <script> tags
    const headers = new Headers(req.headers);
    headers.set("content-security-policy", csp);
    res = NextResponse.next({ request: { headers } });
  } else if (ok) res = NextResponse.next();
  else if (!isPage) res = NextResponse.json({ error: "unauthorized" }, { status: 401 });
  else res = NextResponse.redirect(new URL("/admin/login", req.url));

  if (csp) res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
