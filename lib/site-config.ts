import { unstable_cache, revalidateTag } from "next/cache";
import { kv, safe } from "@/lib/kv";

// Site-wide switches and the announcement banner, editable in /admin without a deploy.
// Pages read a cached copy; saving revalidates the "site-config" tag so pages pick it up.

export const FEATURE_FLAGS = {
  showcase: { label: "Ask Ninja launch showcase", hint: "Full-screen intro / corner card for new visitors" },
  launcher: { label: "Floating “Ask Ninja” button", hint: "Bottom-right on every page" },
  whatsNew: { label: "“What's new” popup", hint: "First-visit popup listing the newest tools" },
  support: { label: "Patreon support links", hint: "Sidebar button and end-of-page support cards" },
  ratings: { label: "Ratings & comments widget", hint: "Under every tool; existing ratings are kept" },
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type Flags = Record<FeatureFlag, boolean>;

export interface Banner {
  enabled: boolean;
  id: string; // changes on every save, so a new banner shows again to people who dismissed the old one
  text: string;
  linkText: string;
  href: string;
  tone: "info" | "success" | "warning";
  until: string; // ISO date, "" = no end
}

export interface SiteConfig {
  flags: Flags;
  banner: Banner | null;
}

const DEFAULT_FLAGS: Flags = { showcase: true, launcher: true, whatsNew: true, support: true, ratings: true };
const K = { flags: "tn:flags", banner: "tn:banner" };
export const SITE_CONFIG_TAG = "site-config";

async function load(): Promise<SiteConfig> {
  const [rawFlags, rawBanner] = (await safe(() => kv().batch().hgetall(K.flags).get(K.banner).exec(), [null, null])) as [
    Record<string, string> | null,
    string | null,
  ];
  const flags = { ...DEFAULT_FLAGS };
  for (const k of Object.keys(DEFAULT_FLAGS) as FeatureFlag[]) if (rawFlags?.[k] !== undefined) flags[k] = rawFlags[k] === "1";
  let banner: Banner | null = null;
  try {
    if (rawBanner) banner = JSON.parse(rawBanner);
  } catch {}
  return { flags, banner };
}

/** Cached for pages; refreshed whenever an admin saves. */
// The "v2" key part retires cache entries written by builds that couldn't reach storage (they cached
// empty values). Bump it if that ever happens again.
export const getSiteConfig = unstable_cache(load, ["site-config", "v2"], { tags: [SITE_CONFIG_TAG], revalidate: 3600 });

/** Uncached, for the admin pages. */
export const getSiteConfigFresh = load;

export async function saveFlags(flags: Partial<Flags>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flags)) if (k in DEFAULT_FLAGS) out[k] = v ? "1" : "0";
  if (Object.keys(out).length) await kv().hset(K.flags, out);
  revalidateTag(SITE_CONFIG_TAG);
}

export async function saveBanner(b: Omit<Banner, "id">) {
  const banner: Banner = { ...b, id: Date.now().toString(36) };
  await kv().set(K.banner, JSON.stringify(banner));
  revalidateTag(SITE_CONFIG_TAG);
}

export function bannerActive(b: Banner | null, now = Date.now()): b is Banner {
  return Boolean(b && b.enabled && b.text.trim() && (!b.until || Date.parse(b.until) > now));
}
