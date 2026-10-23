import { issueToken, isTool } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The rating widget fetches this when it scrolls into view. Submissions must carry a valid,
// sufficiently old token — so bots that post straight to the API (or instantly) are filtered out.
export function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!isTool(slug)) return Response.json({ error: "unknown tool" }, { status: 404 });
  return Response.json({ token: issueToken(slug) }, { headers: { "Cache-Control": "no-store" } });
}
