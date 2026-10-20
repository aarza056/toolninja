// Patreon support. Tiers mirror what's set up on Patreon — update both together.
export const PATREON_URL = "https://www.patreon.com/cw/ToolNinjaio";

export interface SupportTier {
  name: string;
  price: number; // USD per month
  trial?: string;
  perks: string[];
}

export const SUPPORT_TIERS: SupportTier[] = [
  {
    name: "Ninja Supporter",
    price: 3,
    trial: "7-day free trial",
    perks: ["Support continued development of free tools", "Supporter recognition, if you want it", "Occasional development updates"],
  },
];

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

// Counts Patreon clicks per placement in Google Analytics. GA only loads after a visitor accepts
// analytics cookies, so without consent this is a no-op.
export function trackSupportClick(placement: string) {
  try {
    (window as GtagWindow).gtag?.("event", "patreon_click", { placement });
  } catch {
    /* analytics must never break a link */
  }
}

/** Patreon link with UTM tags so Patreon's own stats show where supporters came from. */
export function patreonHref(placement: string) {
  return `${PATREON_URL}?utm_source=toolninja.io&utm_medium=${encodeURIComponent(placement)}`;
}
