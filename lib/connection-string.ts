export interface ParsedConnection {
  scheme: string;
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
  params: Record<string, string>;
}

export const DEFAULT_PORTS: Record<string, number> = {
  postgres: 5432,
  postgresql: 5432,
  mysql: 3306,
  mongodb: 27017,
  redis: 6379,
};

export const EMPTY_CONNECTION: ParsedConnection = {
  scheme: "postgres",
  user: "",
  password: "",
  host: "",
  port: "",
  database: "",
  params: {},
};

export function parseConnectionString(input: string): ParsedConnection {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Paste a connection string first");
  if (trimmed.includes(",")) {
    throw new Error("Multi-host strings (replica sets / cluster lists) aren't supported — parse one host at a time.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Not a valid URI — expected scheme://user:password@host:port/database?params");
  }

  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  return {
    scheme: url.protocol.replace(/:$/, ""),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port,
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    params,
  };
}

export function buildConnectionString(p: ParsedConnection): string {
  if (!p.host.trim()) return "";
  const auth = p.user.trim()
    ? `${encodeURIComponent(p.user.trim())}${p.password ? ":" + encodeURIComponent(p.password) : ""}@`
    : "";
  const port = p.port.trim() ? `:${p.port.trim()}` : "";
  const db = p.database.trim() ? `/${encodeURIComponent(p.database.trim())}` : "/";
  const entries = Object.entries(p.params).filter(([k]) => k.trim());
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `${p.scheme.trim() || "postgres"}://${auth}${p.host.trim()}${port}${db}${query ? "?" + query : ""}`;
}
