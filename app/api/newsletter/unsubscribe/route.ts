import { unsubscribe } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Two callers:
// • Gmail / Yahoo "Unsubscribe" buttons (RFC 8058 one-click): POST ?t=<token> with the body
//   "List-Unsubscribe=One-Click". No origin header and no cookies — the token is the proof.
// • The button on /newsletter/unsubscribe, which posts a form and expects to land back on the page.
// GET never unsubscribes: link scanners open every URL in an email.

export async function POST(req: Request) {
  const url = new URL(req.url);
  let t = url.searchParams.get("t") ?? "";
  let fromPage = false;
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("form")) {
    const form = await req.formData().catch(() => null);
    if (form) {
      t = String(form.get("t") ?? t);
      fromPage = form.get("from") === "page";
    }
  }
  const ok = await unsubscribe(t).catch(() => false);
  if (fromPage) {
    return Response.redirect(new URL(`/newsletter/unsubscribe?t=${encodeURIComponent(t)}&done=${ok ? 1 : 0}`, url.origin), 303);
  }
  return new Response(ok ? "Unsubscribed" : "Unknown link", { status: ok ? 200 : 404, headers: { "Cache-Control": "no-store" } });
}

export function GET(req: Request) {
  const url = new URL(req.url);
  return Response.redirect(new URL(`/newsletter/unsubscribe?t=${encodeURIComponent(url.searchParams.get("t") ?? "")}`, url.origin), 303);
}
