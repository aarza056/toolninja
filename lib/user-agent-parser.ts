export interface ParsedUserAgent {
  browser: { name: string; version: string } | null;
  engine: { name: string; version: string } | null;
  os: { name: string; version: string } | null;
  device: { type: "mobile" | "tablet" | "desktop" | "bot"; vendor?: string; model?: string };
  isBot: boolean;
}

const BOT_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "Googlebot", re: /Googlebot/i },
  { name: "Bingbot", re: /bingbot/i },
  { name: "GPTBot (OpenAI)", re: /GPTBot/i },
  { name: "ChatGPT-User", re: /ChatGPT-User/i },
  { name: "ClaudeBot", re: /ClaudeBot|Claude-Web|anthropic-ai/i },
  { name: "PerplexityBot", re: /PerplexityBot/i },
  { name: "Applebot", re: /Applebot/i },
  { name: "DuckDuckBot", re: /DuckDuckBot/i },
  { name: "YandexBot", re: /YandexBot/i },
  { name: "Slackbot", re: /Slackbot/i },
  { name: "Discordbot", re: /Discordbot/i },
  { name: "facebookexternalhit", re: /facebookexternalhit/i },
  { name: "Twitterbot", re: /Twitterbot/i },
  { name: "LinkedInBot", re: /LinkedInBot/i },
  { name: "AhrefsBot", re: /AhrefsBot/i },
  { name: "SemrushBot", re: /SemrushBot/i },
  { name: "curl", re: /^curl\// },
  { name: "wget", re: /^Wget\// },
  { name: "Postman", re: /PostmanRuntime/i },
  { name: "Python requests", re: /python-requests/i },
  { name: "Generic bot/crawler", re: /bot|crawler|spider|scraper/i },
];

function match(ua: string, re: RegExp): string | null {
  const m = ua.match(re);
  return m ? m[1] : null;
}

function detectBrowser(ua: string): { name: string; version: string } | null {
  // Order matters: Edge/Opera/Brave embed "Chrome" and "Safari" tokens, so check them first.
  const checks: { name: string; re: RegExp }[] = [
    { name: "Edge", re: /Edg(?:A|iOS)?\/([\d.]+)/ },
    { name: "Opera", re: /(?:OPR|Opera)\/([\d.]+)/ },
    { name: "Brave", re: /Brave\/([\d.]+)/ },
    { name: "Samsung Internet", re: /SamsungBrowser\/([\d.]+)/ },
    { name: "Vivaldi", re: /Vivaldi\/([\d.]+)/ },
    { name: "Firefox", re: /Firefox\/([\d.]+)/ },
    { name: "Chrome", re: /(?:Chrome|CriOS)\/([\d.]+)/ },
    { name: "Safari", re: /Version\/([\d.]+).*Safari/ },
    { name: "Internet Explorer", re: /(?:MSIE |rv:)([\d.]+).*Trident/ },
  ];
  for (const c of checks) {
    const version = match(ua, c.re);
    if (version) return { name: c.name, version };
  }
  return null;
}

function detectEngine(ua: string): { name: string; version: string } | null {
  const checks: { name: string; re: RegExp }[] = [
    { name: "Blink", re: /Chrome\/([\d.]+)/ },
    { name: "Gecko", re: /Gecko\/([\d.]+)/ },
    { name: "WebKit", re: /AppleWebKit\/([\d.]+)/ },
    { name: "Trident", re: /Trident\/([\d.]+)/ },
  ];
  // Chrome's UA includes a fixed "Gecko/20100101"-style token only in Firefox; Blink-based
  // browsers report an actual WebKit version too, so prefer Blink detection first.
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    const v = match(ua, /Chrome\/([\d.]+)/);
    if (v) return { name: "Blink", version: v };
  }
  for (const c of checks) {
    const version = match(ua, c.re);
    if (version) return { name: c.name, version };
  }
  return null;
}

function detectOS(ua: string): { name: string; version: string } | null {
  const checks: { name: string; re: RegExp; versionTransform?: (v: string) => string }[] = [
    { name: "Windows", re: /Windows NT ([\d.]+)/, versionTransform: (v) => WINDOWS_VERSIONS[v] ?? v },
    { name: "iOS", re: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/, versionTransform: (v) => v.replace(/_/g, ".") },
    { name: "macOS", re: /Mac OS X ([\d_]+)/, versionTransform: (v) => v.replace(/_/g, ".") },
    { name: "Android", re: /Android ([\d.]+)/ },
    { name: "Chrome OS", re: /CrOS [^\s]+ ([\d.]+)/ },
    { name: "Linux", re: /(Linux)/, versionTransform: () => "" },
  ];
  for (const c of checks) {
    const raw = match(ua, c.re);
    if (raw) return { name: c.name, version: c.versionTransform ? c.versionTransform(raw) : raw };
  }
  return null;
}

const WINDOWS_VERSIONS: Record<string, string> = {
  "10.0": "10 / 11",
  "6.3": "8.1",
  "6.2": "8",
  "6.1": "7",
  "6.0": "Vista",
  "5.1": "XP",
};

function detectDevice(ua: string): ParsedUserAgent["device"] {
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))) {
    return { type: "tablet", vendor: "Apple", model: "iPad" };
  }
  if (/Tablet|SM-T|Nexus 7|Nexus 10/.test(ua)) return { type: "tablet" };
  if (/iPhone/.test(ua)) return { type: "mobile", vendor: "Apple", model: "iPhone" };
  if (/iPod/.test(ua)) return { type: "mobile", vendor: "Apple", model: "iPod" };
  if (/Android/.test(ua) && /Mobile/.test(ua)) return { type: "mobile", vendor: "Google", model: "Android" };
  if (/Android/.test(ua)) return { type: "tablet", vendor: "Google", model: "Android" };
  return { type: "desktop" };
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const trimmed = ua.trim();

  const bot = BOT_PATTERNS.find((b) => b.re.test(trimmed));
  if (bot) {
    return {
      browser: { name: bot.name, version: match(trimmed, /\/([\d.]+)/) ?? "" },
      engine: null,
      os: detectOS(trimmed),
      device: { type: "bot" },
      isBot: true,
    };
  }

  return {
    browser: detectBrowser(trimmed),
    engine: detectEngine(trimmed),
    os: detectOS(trimmed),
    device: detectDevice(trimmed),
    isBot: false,
  };
}
