import { getAllPosts } from "@/lib/blog";
import { buildErrorIndex } from "@/lib/error-matcher";

export const dynamic = "force-static";

// Loaded by the assistant only when it opens, so the guide list isn't embedded in every page.
export function GET() {
  return Response.json(buildErrorIndex(getAllPosts()));
}
