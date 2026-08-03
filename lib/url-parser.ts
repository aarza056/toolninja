export interface UrlParam {
  key: string;
  value: string;
}

export interface ParsedUrl {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: UrlParam[];
}

export function parseUrl(input: string): ParsedUrl | null {
  try {
    const u = new URL(input);
    return {
      protocol: u.protocol.replace(":", ""),
      username: u.username,
      password: u.password,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      params: Array.from(u.searchParams.entries()).map(([key, value]) => ({ key, value })),
    };
  } catch {
    return null;
  }
}

export function buildUrlWithParams(base: string, params: UrlParam[]): string {
  try {
    const u = new URL(base);
    u.search = "";
    params.forEach(({ key, value }) => {
      if (key) u.searchParams.append(key, value);
    });
    return u.toString();
  } catch {
    return "";
  }
}

export const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
