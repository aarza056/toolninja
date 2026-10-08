// Blog authors. Every post's `author` frontmatter is an id from this map; unknown ids fall back
// to DEFAULT_AUTHOR_ID. Each author gets a page at /authors/<id> and is used for the byline and
// the Article JSON-LD `author`.
//
// TODO(owner): add a real person for the posts you (or someone else) actually wrote, using the
// commented template below, then set `author: "<id>"` in those posts' frontmatter. Only list
// credentials and links that are true; leave a field out rather than guessing.

export interface Author {
  id: string;
  type: "Person" | "Organization";
  name: string;
  role?: string;
  bio: string;
  url?: string; // personal site
  sameAs?: string[]; // GitHub, LinkedIn, Mastodon… profile URLs
}

export const DEFAULT_AUTHOR_ID = "toolninja";

export const AUTHORS: Record<string, Author> = {
  toolninja: {
    id: "toolninja",
    type: "Organization",
    name: "ToolNinja",
    bio: "ToolNinja builds free developer tools that process your input in the browser. Guides on this blog are written to explain the errors and formats those tools deal with.",
    // TODO(owner): replace this bio with who actually writes and reviews these guides.
  },
  // "your-id": {
  //   id: "your-id",
  //   type: "Person",
  //   name: "TODO(owner): full name",
  //   role: "TODO(owner): e.g. Software engineer",
  //   bio: "TODO(owner): two or three true sentences about relevant experience.",
  //   url: "TODO(owner): https://…",
  //   sameAs: ["TODO(owner): https://github.com/…"],
  // },
};

export function getAuthor(id: string | undefined): Author {
  return (id && AUTHORS[id]) || AUTHORS[DEFAULT_AUTHOR_ID];
}
