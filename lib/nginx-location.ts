// Which nginx `location` block handles a request, worked out the way nginx itself does it
// (ngx_http_core_find_location):
//   1. exact (=) locations, then the longest matching prefix location (plain or ^~)
//   2. an exact match stops the search; so does a ^~ longest prefix
//   3. otherwise the regex locations nested inside that prefix location are tried, then the
//      top-level regex locations, in the order they appear; the first that matches wins
//   4. no regex matched: the longest prefix location is used
// Matching uses the decoded, normalized path, without the query string.

export type LocationModifier = "=" | "^~" | "~" | "~*" | "" | "@";

export interface NginxLocation {
  id: number;
  modifier: LocationModifier;
  pattern: string;
  /** 1-based line of the `location` directive */
  line: number;
  /** The directives directly inside the block, one per entry, without nested blocks */
  directives: string[];
  children: NginxLocation[];
  parent: number | null;
  /** The regex didn't compile in JavaScript (or uses PCRE-only syntax) */
  regexError?: string;
}

export interface ParsedConfig {
  locations: NginxLocation[];
  /** All locations, flattened, in config order */
  all: NginxLocation[];
  warnings: string[];
}

interface Token {
  text: string;
  line: number;
  quoted: boolean;
}

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let line = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      line++;
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "#") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "{" || c === "}" || c === ";") {
      out.push({ text: c, line, quoted: false });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const start = line;
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== c) {
        if (src[j] === "\\" && j + 1 < src.length) {
          // nginx keeps the backslash in regexes except before the quote character itself
          s += src[j + 1] === c ? c : src[j] + src[j + 1];
          j += 2;
          continue;
        }
        if (src[j] === "\n") line++;
        s += src[j++];
      }
      out.push({ text: s, line: start, quoted: true });
      i = j + 1;
      continue;
    }
    let j = i;
    let s = "";
    while (j < src.length && !/[\s;{}]/.test(src[j])) {
      if (src[j] === "\\" && j + 1 < src.length) {
        s += src[j] + src[j + 1];
        j += 2;
        continue;
      }
      s += src[j++];
    }
    out.push({ text: s, line, quoted: false });
    i = j;
  }
  return out;
}

/** PCRE syntax JavaScript doesn't share, rewritten where the meaning is the same */
export function pcreToJs(pattern: string): { source: string; error?: string } {
  let source = pattern.replace(/\(\?P<([A-Za-z_][A-Za-z0-9_]*)>/g, "(?<$1>").replace(/\(\?P=([A-Za-z_][A-Za-z0-9_]*)\)/g, "\\k<$1>");
  // An inline (?i) at the start is common in nginx configs
  let flags = "";
  const inline = /^\(\?([imsx]+)\)/.exec(source);
  if (inline) {
    source = source.slice(inline[0].length);
    if (inline[1].includes("i")) flags += "i";
    if (inline[1].includes("s")) flags += "s";
    if (inline[1].includes("x")) return { source, error: "The (?x) extended mode has no JavaScript equivalent, so this regex can't be tested here." };
  }
  if (/\\[AZzG]|\(\?>|[^\\][*+?}]\+/.test(source)) {
    return { source, error: "This regex uses PCRE-only syntax (\\A, \\Z, atomic groups or possessive quantifiers) that can't be tested in the browser." };
  }
  try {
    new RegExp(source);
  } catch (e) {
    return { source, error: e instanceof Error ? e.message.replace(/^Invalid regular expression: /, "") : "invalid regex" };
  }
  return { source: flags ? `(?${flags})${source}` : source };
}

function compile(loc: NginxLocation): RegExp | null {
  if (loc.modifier !== "~" && loc.modifier !== "~*") return null;
  let { source } = pcreToJs(loc.pattern);
  let flags = loc.modifier === "~*" ? "i" : "";
  const inline = /^\(\?([is]+)\)/.exec(source);
  if (inline) {
    source = source.slice(inline[0].length);
    if (inline[1].includes("i") && !flags.includes("i")) flags += "i";
    if (inline[1].includes("s")) flags += "s";
  }
  try {
    return new RegExp(source, flags);
  } catch {
    return null;
  }
}

function splitModifier(args: string[], quotedFirst: boolean): { modifier: LocationModifier; pattern: string } | null {
  if (args.length === 2) {
    const m = args[0];
    if (m === "=" || m === "^~" || m === "~" || m === "~*") return { modifier: m, pattern: args[1] };
    return null;
  }
  if (args.length !== 1) return null;
  const a = args[0];
  if (quotedFirst) return { modifier: "", pattern: a };
  if (a.startsWith("@")) return { modifier: "@", pattern: a };
  if (a.startsWith("^~")) return { modifier: "^~", pattern: a.slice(2) };
  if (a.startsWith("~*")) return { modifier: "~*", pattern: a.slice(2) };
  if (a.startsWith("~")) return { modifier: "~", pattern: a.slice(1) };
  if (a.startsWith("=")) return { modifier: "=", pattern: a.slice(1) };
  return { modifier: "", pattern: a };
}

export function parseNginxConfig(src: string): ParsedConfig {
  const tokens = tokenize(src);
  const warnings: string[] = [];
  const all: NginxLocation[] = [];
  const top: NginxLocation[] = [];
  let servers = 0;

  // A stack of open blocks; a location entry holds its NginxLocation
  const stack: ({ kind: "location"; loc: NginxLocation } | { kind: "other"; name: string })[] = [];
  let stmt: Token[] = [];

  const currentLocation = () => {
    for (let k = stack.length - 1; k >= 0; k--) {
      const s = stack[k];
      if (s.kind === "location") return s.loc;
    }
    return null;
  };

  for (const t of tokens) {
    if (!t.quoted && t.text === "{") {
      const name = stmt[0]?.text ?? "";
      if (name === "location" && !stmt[0].quoted) {
        const args = stmt.slice(1);
        const parsed = splitModifier(
          args.map((a) => a.text),
          args[0]?.quoted ?? false
        );
        const parent = currentLocation();
        if (!parsed || !parsed.pattern) {
          warnings.push(`Line ${stmt[0].line}: couldn't read this location directive.`);
          stack.push({ kind: "other", name: "location" });
        } else {
          const loc: NginxLocation = { id: all.length, modifier: parsed.modifier, pattern: parsed.pattern, line: stmt[0].line, directives: [], children: [], parent: parent ? parent.id : null };
          if (loc.modifier === "~" || loc.modifier === "~*") {
            const check = pcreToJs(loc.pattern);
            if (check.error) loc.regexError = check.error;
          }
          if (parent) {
            if (parent.modifier === "=") warnings.push(`Line ${loc.line}: an exact (=) location can't contain nested locations; nginx rejects this config.`);
            if (parent.modifier === "@") warnings.push(`Line ${loc.line}: a named location can't contain nested locations; nginx rejects this config.`);
            if (loc.modifier === "" || loc.modifier === "^~" || loc.modifier === "=") {
              if (!loc.pattern.startsWith(parent.pattern) && (parent.modifier === "" || parent.modifier === "^~")) {
                warnings.push(`Line ${loc.line}: the nested location "${loc.pattern}" is outside its parent "${parent.pattern}"; nginx rejects this config.`);
              }
            }
            parent.children.push(loc);
          } else top.push(loc);
          all.push(loc);
          stack.push({ kind: "location", loc });
        }
      } else {
        if (name === "server") {
          servers++;
          if (servers === 2) warnings.push("The config has more than one server block. Their locations are tested together here; paste one server block to test it on its own.");
        }
        // Directives inside if / limit_except blocks still count as the surrounding location's
        stack.push({ kind: "other", name });
      }
      stmt = [];
      continue;
    }
    if (!t.quoted && t.text === "}") {
      if (stmt.length) {
        warnings.push(`Line ${stmt[0].line}: "${stmt.map((s) => s.text).join(" ")}" is missing a semicolon.`);
        stmt = [];
      }
      if (!stack.length) warnings.push(`Line ${t.line}: there's an extra closing brace.`);
      else stack.pop();
      continue;
    }
    if (!t.quoted && t.text === ";") {
      const loc = currentLocation();
      const innermost = stack[stack.length - 1];
      if (loc && stmt.length && innermost && innermost.kind === "location") {
        loc.directives.push(stmt.map((s) => (s.quoted ? `"${s.text}"` : s.text)).join(" "));
      } else if (loc && stmt.length && innermost && innermost.kind === "other") {
        loc.directives.push(`${innermost.name} { ${stmt.map((s) => (s.quoted ? `"${s.text}"` : s.text)).join(" ")}; }`);
      }
      stmt = [];
      continue;
    }
    stmt.push(t);
  }
  if (stack.length) warnings.push(`A block isn't closed: ${stack.length} closing brace${stack.length === 1 ? " is" : "s are"} missing.`);

  // Duplicate locations make nginx refuse to start
  const seen = new Map<string, number>();
  for (const l of all) {
    if (l.modifier === "~" || l.modifier === "~*" || l.modifier === "@") continue;
    const key = `${l.modifier === "=" ? "=" : "p"} ${l.pattern}`;
    if (seen.has(key)) warnings.push(`Line ${l.line}: duplicate location "${l.pattern}" (also on line ${seen.get(key)}); nginx refuses to start.`);
    else seen.set(key, l.line);
  }
  return { locations: top, all, warnings };
}

/** The path nginx matches locations against: decoded, without query string, slashes merged, dot segments resolved */
export function normalizeUri(input: string): { uri: string; query: string; error?: string } {
  let raw = input.trim();
  if (!raw) return { uri: "/", query: "" };
  const abs = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(raw);
  if (abs) raw = raw.slice(abs[0].length) || "/";
  raw = raw.replace(/#.*$/, "");
  const q = raw.indexOf("?");
  const query = q >= 0 ? raw.slice(q + 1) : "";
  let path = q >= 0 ? raw.slice(0, q) : raw;
  if (!path.startsWith("/")) path = `/${path}`;
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return { uri: path, query, error: "The path has a broken %-escape; nginx answers 400 Bad Request." };
  }
  decoded = decoded.replace(/\/{2,}/g, "/");
  const segs: string[] = [];
  const parts = decoded.split("/");
  for (let k = 1; k < parts.length; k++) {
    const p = parts[k];
    if (p === ".") {
      if (k === parts.length - 1) segs.push("");
      continue;
    }
    if (p === "..") {
      if (!segs.length) return { uri: "/", query, error: "The path climbs above the root with ../; nginx answers 400 Bad Request." };
      segs.pop();
      if (k === parts.length - 1) segs.push("");
      continue;
    }
    segs.push(p);
  }
  return { uri: `/${segs.join("/")}`, query };
}

export interface MatchStep {
  locationId: number;
  kind: "exact" | "prefix" | "regex";
  matched: boolean;
  note: string;
}

export interface MatchResult {
  uri: string;
  query: string;
  error?: string;
  /** The location that handles the request, or null when nothing matches (nginx answers 404 from the server root) */
  location: NginxLocation | null;
  reason: string;
  steps: MatchStep[];
  captures: string[];
  named: Record<string, string>;
  /** A prefix location ending in / with a *_pass directive: nginx answers a 301 to add the slash */
  redirect?: string;
}

const describe = (l: NginxLocation) => `location ${l.modifier ? `${l.modifier} ` : ""}${l.pattern}`;
export const locationLabel = describe;

const PASS = /^(proxy_pass|fastcgi_pass|uwsgi_pass|scgi_pass|memcached_pass|grpc_pass)\b/;

interface Found {
  loc: NginxLocation | null;
  /** exact or regex: nginx stops; prefix: the parent level still tries its own regexes */
  how: "exact" | "regex" | "prefix" | "none";
  /** The ^~ prefix that switched off this level's regexes */
  noregex?: NginxLocation;
  captures: string[];
  named: Record<string, string>;
  redirectFrom?: NginxLocation;
}

function findIn(level: NginxLocation[], uri: string, steps: MatchStep[]): Found {
  let exact: NginxLocation | null = null;
  let best: NginxLocation | null = null;
  let slashRedirect: NginxLocation | undefined;
  for (const l of level) {
    if (l.modifier === "=") {
      const hit = uri === l.pattern;
      steps.push({ locationId: l.id, kind: "exact", matched: hit, note: hit ? "Exact match: nginx stops here." : "Not an exact match." });
      if (hit && !exact) exact = l;
    } else if (l.modifier === "" || l.modifier === "^~") {
      const hit = uri.startsWith(l.pattern);
      if (!hit && l.pattern.endsWith("/") && uri === l.pattern.slice(0, -1) && l.directives.some((d) => PASS.test(d))) slashRedirect = l;
      steps.push({ locationId: l.id, kind: "prefix", matched: hit, note: hit ? `Prefix matches (${l.pattern.length} characters).` : "Prefix doesn't match." });
      if (hit && (!best || l.pattern.length > best.pattern.length)) best = l;
    }
  }
  if (exact) return { loc: exact, how: "exact", captures: [], named: {} };

  let tentative: Found = { loc: null, how: "none", captures: [], named: {}, redirectFrom: slashRedirect };
  if (best) {
    tentative = { loc: best, how: "prefix", captures: [], named: {}, redirectFrom: slashRedirect };
    // nginx searches the longest prefix location's own nested locations first, regexes included
    if (best.children.length) {
      const inner = findIn(best.children, uri, steps);
      if (inner.how === "exact" || inner.how === "regex") return inner;
      if (inner.loc) tentative = { ...inner, redirectFrom: inner.redirectFrom ?? slashRedirect };
    }
    if (best.modifier === "^~") return { ...tentative, noregex: best };
  }

  for (const l of level) {
    if (l.modifier !== "~" && l.modifier !== "~*") continue;
    const re = compile(l);
    if (!re) {
      steps.push({ locationId: l.id, kind: "regex", matched: false, note: l.regexError ? `Can't test: ${l.regexError}` : "Can't compile this regex." });
      continue;
    }
    const m = re.exec(uri);
    steps.push({ locationId: l.id, kind: "regex", matched: !!m, note: m ? "The regex matches. The first matching regex wins." : `No match${l.modifier === "~" ? " (case-sensitive)" : ""}.` });
    if (m) return { loc: l, how: "regex", captures: m.slice(1).map((c) => c ?? ""), named: { ...(m.groups ?? {}) } };
  }
  return tentative;
}

export function matchLocation(config: ParsedConfig, input: string): MatchResult {
  const n = normalizeUri(input);
  const steps: MatchStep[] = [];
  if (n.error) return { uri: n.uri, query: n.query, error: n.error, location: null, reason: n.error, steps, captures: [], named: {} };
  const r = findIn(config.locations, n.uri, steps);
  const prefixes = steps.filter((s) => s.kind === "prefix" && s.matched).map((s) => config.all[s.locationId]);
  const longest = prefixes.length ? prefixes.reduce((a, b) => (b.pattern.length > a.pattern.length ? b : a)) : null;
  let reason: string;
  if (r.how === "exact") reason = "An exact (=) location matched, so nginx used it without looking any further.";
  else if (r.how === "regex") {
    const nested = r.loc!.parent !== null ? ` It's nested inside ${describe(config.all[r.loc!.parent])}, whose regexes nginx tries first.` : "";
    reason = `${longest ? `The longest matching prefix was ${describe(longest)}, but regex locations win over prefixes.` : "No prefix location matched."} nginx used the first regex that matches, in config order.${nested}`;
  } else if (r.how === "prefix") {
    reason = r.noregex
      ? `${describe(r.noregex)} is the longest matching prefix and has the ^~ modifier, so nginx didn't try the regex locations.`
      : `${describe(r.loc!)} is the longest matching prefix and no regex location matched, so nginx used it.`;
  } else reason = "No location matched. nginx serves the request with the server block's own settings (usually a 404 from its root).";

  const result: MatchResult = { uri: n.uri, query: n.query, location: r.loc, reason, steps, captures: r.captures, named: r.named };
  // nginx only redirects when the slash-ending location would have been the answer for the slashed URI,
  // i.e. when nothing more specific (exact or regex) handled the request
  if (r.redirectFrom && r.how !== "exact" && r.how !== "regex") {
    result.redirect = `${r.redirectFrom.pattern}${n.query ? `?${n.query}` : ""}`;
    result.reason = `${describe(r.redirectFrom)} ends in a slash and passes requests to a backend, so for ${n.uri} nginx answers with a 301 redirect to ${r.redirectFrom.pattern}.`;
  }
  return result;
}

export const NGINX_EXAMPLE = `server {
    listen 80;
    server_name example.com;
    root /var/www/html;

    location = / {
        try_files /index.html =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
    }

    location ^~ /static/ {
        expires 30d;
    }

    location ~* \\.(jpg|jpeg|png|gif|webp|svg)$ {
        expires 7d;
    }

    location ~ ^/users/(?<id>\\d+)/avatar$ {
        rewrite ^ /api/avatar?id=$id last;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }
}
`;

export const NGINX_EXAMPLE_URLS = ["/", "/about", "/api/users", "/api", "/static/logo.png", "/images/logo.PNG", "/users/42/avatar", "/index.php?page=2"];
