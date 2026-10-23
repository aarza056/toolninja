import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";

// Guards /admin and /api/admin. Every admin page and action also re-checks the session on the server;
// this is the outer gate, and it keeps admin URLs out of search engines.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  const ok = isLogin || (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) !== null;

  let res: NextResponse;
  if (ok) res = NextResponse.next();
  else if (pathname.startsWith("/api/")) res = NextResponse.json({ error: "unauthorized" }, { status: 401 });
  else res = NextResponse.redirect(new URL("/admin/login", req.url));

  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
