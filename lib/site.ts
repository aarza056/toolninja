// Site-wide constants shared by metadata, structured data and marketing copy.
// Keep claims here so every page states the same, accurate thing.

export const SITE_URL = "https://toolninja.io";
export const SITE_NAME = "ToolNinja";

// The one privacy claim the site makes about tool input. It is scoped to what you type into a
// tool on purpose: the site itself does have server logs, consent-based analytics and ads (see
// /privacy), and a few tools send requests you direct (see NETWORK_TOOLS).
export const INPUT_PRIVACY_CLAIM = "Your input is processed in your browser and never uploaded.";

// Tools that make network requests as part of what they do. Each one shows a NetworkNotice on
// its own page, and the privacy policy lists them.
export const NETWORK_TOOLS: Record<string, string> = {
  "http-request":
    "This tool sends the request you build (URL, headers and body) directly from your browser to the server you enter. Nothing goes through ToolNinja, but that server receives everything in the request.",
  "readme-badge-generator":
    "Badge previews load from img.shields.io, so the badge text and any repository or package names you enter are sent to shields.io to render the image.",
};

// Optional public user count shown in the homepage stats bar. Leave null until there is a real,
// sourced number.
// TODO(owner): supply a real, sourced user count (e.g. monthly active users from analytics) and
// note the source and date here, or leave null to keep the stat hidden.
export const PUBLIC_USER_COUNT: { value: string; label: string; source: string } | null = null;

// Privacy contact shown on /privacy for data-subject requests (GDPR / UK GDPR / CCPA).
// TODO(owner): set a monitored email address. Until then the policy points to the repository.
export const PRIVACY_CONTACT_EMAIL: string | null = null;
// TODO(owner): legal name (person or company) acting as data controller, shown on /privacy.
export const DATA_CONTROLLER_NAME: string | null = null;
