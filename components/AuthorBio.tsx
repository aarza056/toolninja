import Link from "next/link";
import type { Author } from "@/lib/authors";

// Author box shown at the end of each blog post, populated from lib/authors.ts.
export default function AuthorBio({ author }: { author: Author }) {
  return (
    <aside aria-label="About the author" className="mt-10 p-5 bg-[#111111] border border-[#222222] rounded-xl">
      <p className="text-xs uppercase tracking-widest text-[#888888] mb-2">Written by</p>
      <p className="text-sm font-semibold text-[#f5f5f5] mb-1">
        <Link href={`/authors/${author.id}`} className="hover:text-[#c084fc] transition-colors">
          {author.name}
        </Link>
        {author.role && <span className="font-normal text-[#aaaaaa]"> · {author.role}</span>}
      </p>
      <p className="text-sm text-[#aaaaaa] leading-relaxed">{author.bio}</p>
    </aside>
  );
}
