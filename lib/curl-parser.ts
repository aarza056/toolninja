export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  error: string | null;
}

function tokenize(cmd: string): string[] {
  // Collapse backslash-newline line continuations (common when copying multi-line curl from devtools)
  const joined = cmd.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let i = 0;

  while (i < joined.length) {
    const ch = joined[i];

    if (quote) {
      if (ch === "\\" && quote === '"' && i + 1 < joined.length) {
        current += joined[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = null;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      i++;
      continue;
    }
    if (ch === "\\" && i + 1 < joined.length) {
      current += joined[i + 1];
      i += 2;
      continue;
    }
    current += ch;
    i++;
  }
  if (current) tokens.push(current);
  return tokens;
}

const NO_ARG_FLAGS = new Set([
  "-k", "--insecure", "-s", "--silent", "-v", "--verbose", "-L", "--location",
  "--compressed", "-i", "--include", "-#", "--progress-bar", "-f", "--fail",
  "-N", "--no-buffer", "-G", "--get",
]);

export function parseCurl(input: string): ParsedCurl {
  const trimmed = input.trim();
  if (!trimmed) return { method: "GET", url: "", headers: {}, body: null, error: "Paste a curl command to convert it" };
  if (!/^curl\b/i.test(trimmed)) {
    return { method: "GET", url: "", headers: {}, body: null, error: "Command must start with 'curl'" };
  }

  const cmd = trimmed.replace(/^curl\s*/i, "");
  const tokens = tokenize(cmd);

  let method = "";
  let url = "";
  const headers: Record<string, string> = {};
  let body: string | null = null;
  let hasData = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === "-X" || t === "--request") {
      method = (tokens[++i] ?? method).toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const h = tokens[++i] ?? "";
      const idx = h.indexOf(":");
      if (idx !== -1) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-urlencode") {
      const d = tokens[++i] ?? "";
      body = body ? body + "&" + d : d;
      hasData = true;
    } else if (t === "-u" || t === "--user") {
      const cred = tokens[++i] ?? "";
      try {
        headers["Authorization"] = "Basic " + btoa(cred);
      } catch {
        headers["Authorization"] = `Basic <base64 of ${cred}>`;
      }
    } else if (t === "-b" || t === "--cookie") {
      headers["Cookie"] = tokens[++i] ?? "";
    } else if (t === "--url") {
      url = tokens[++i] ?? url;
    } else if (t === "-A" || t === "--user-agent") {
      headers["User-Agent"] = tokens[++i] ?? "";
    } else if (t === "-e" || t === "--referer") {
      headers["Referer"] = tokens[++i] ?? "";
    } else if (t === "-I" || t === "--head") {
      method = method || "HEAD";
    } else if (NO_ARG_FLAGS.has(t)) {
      // flags that take no argument — safe to ignore for code generation
    } else if (!t.startsWith("-") && !url) {
      url = t;
    }
  }

  if (!url) return { method: method || "GET", url: "", headers, body, error: "No URL found in command" };
  if (!method) method = hasData ? "POST" : "GET";

  return { method, url, headers, body, error: null };
}
