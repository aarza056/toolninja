const RECENT_KEY = "toolninja_recent";
const FAVORITES_KEY = "toolninja_favorites";
const MAX_RECENT = 5;

export function addRecentTool(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentTools();
    const updated = [slug, ...existing.filter((s) => s !== slug)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleFavorite(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const existing = getFavoriteTools();
    const isFav = existing.includes(slug);
    const updated = isFav ? existing.filter((s) => s !== slug) : [...existing, slug];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return !isFav;
  } catch {
    return false;
  }
}

export function getFavoriteTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isFavorite(slug: string): boolean {
  return getFavoriteTools().includes(slug);
}
