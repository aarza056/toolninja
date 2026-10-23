import { generateToolJsonLd } from "@/lib/metadata";
import { getToolReviewData, MIN_RATINGS_FOR_STARS } from "@/lib/reviews";

// The tool's WebApplication structured data, with aggregateRating once it has enough real ratings.
// Review data is cached per tool and refreshed only when that tool's ratings change.
export default async function ToolJsonLd({ slug }: { slug: string }) {
  const data = await getToolReviewData(slug);
  const json = generateToolJsonLd(slug, data.count >= MIN_RATINGS_FOR_STARS ? { avg: data.avg, count: data.count } : undefined);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
