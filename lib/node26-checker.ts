import semver from "semver";

// What breaks when moving a project to Node.js 26 (LTS from 28 October 2026). Rules come from the
// v26.0.0 release notes and the deprecations page; removals from Node 23–25 are included too,
// because anyone jumping from Node 20/22 LTS hits those as well.
// This is pattern matching, not a parser — findings are things to look at, not proof.

export type Severity = "error" | "warning" | "info";

export interface Node26Finding {
  severity: Severity;
  /** e.g. DEP0193 */
  code?: string;
  /** The Node version where it changed */
  since: string;
  title: string;
  fix: string;
  line?: number;
  source: "package.json" | "code";
}

interface CodeRule {
  re: RegExp;
  severity: Severity;
  code?: string;
  since: string;
  title: string;
  fix: string;
}

const UTIL_IS = "Boolean|Buffer|Date|Error|Function|Null|NullOrUndefined|Number|Object|Primitive|RegExp|String|Symbol|Undefined";

const CODE_RULES: CodeRule[] = [
  // ── removed in 26 ──
  {
    re: /(?:require\(\s*|from\s+|import\(\s*)["'](?:node:)?_stream_(?:readable|writable|duplex|transform|passthrough|wrap)["']/,
    severity: "error",
    code: "DEP0193",
    since: "26",
    title: "node:_stream_* modules were removed",
    fix: "Import from 'node:stream' instead, e.g. const { Readable } = require('node:stream'). If the error comes from a dependency, the stack trace names it — update that package.",
  },
  {
    re: /\.writeHeader\s*\(/,
    severity: "error",
    code: "DEP0063",
    since: "26",
    title: "response.writeHeader() was removed",
    fix: "It was an undocumented alias — rename it to res.writeHead().",
  },
  // ── runtime-deprecated in 26 (prints a warning, will throw later) ──
  {
    re: /\bmodule\.register\s*\(|\bimport\s*\{[^}]*\bregister\b[^}]*\}\s*from\s*["'](?:node:)?module["']/,
    severity: "warning",
    code: "DEP0205",
    since: "26",
    title: "module.register() is deprecated (prints a warning at startup)",
    fix: "Move the hooks to module.registerHooks(), which is synchronous, in-thread and works for CommonJS too. Loader packages (tsx, ts-node/esm, esmock…) need a release that uses it.",
  },
  {
    re: /Duplex\.toWeb\s*\([^)]*\btype\s*:/,
    severity: "warning",
    code: "DEP0201",
    since: "26",
    title: "Duplex.toWeb() with options.type is deprecated",
    fix: "Rename the option to readableType.",
  },
  {
    re: /\bKeyObject\.from\s*\(/,
    severity: "info",
    code: "DEP0204",
    since: "26",
    title: "KeyObject.from() with a non-extractable CryptoKey is deprecated",
    fix: "Only extractable CryptoKeys may be converted. Keep non-extractable keys in WebCrypto (crypto.subtle).",
  },
  {
    re: /setAuthTag\s*\(/,
    severity: "info",
    code: "DEP0182",
    since: "26",
    title: "Short AES-GCM auth tags now need an explicit authTagLength",
    fix: "If you decrypt with tags shorter than 16 bytes, pass { authTagLength: n } to createDecipheriv(); otherwise setAuthTag() throws.",
  },
  // ── removed in 25 ──
  {
    re: /\bSlowBuffer\b/,
    severity: "error",
    code: "DEP0030",
    since: "25",
    title: "SlowBuffer was removed",
    fix: "Use Buffer.allocUnsafeSlow(size).",
  },
  {
    re: /\bfs\.(F_OK|R_OK|W_OK|X_OK)\b/,
    severity: "error",
    code: "DEP0176",
    since: "25",
    title: "fs.F_OK / R_OK / W_OK / X_OK were removed",
    fix: "Use fs.constants.F_OK (etc.) — they're undefined now, so access checks silently test the wrong thing.",
  },
  {
    re: /\brmdir(?:Sync)?\s*\([^)]*recursive\s*:\s*true/,
    severity: "error",
    code: "DEP0147",
    since: "25",
    title: "fs.rmdir(path, { recursive: true }) was removed",
    fix: "Use fs.rm(path, { recursive: true, force: true }).",
  },
  {
    re: /\bassert\.CallTracker\b|\bnew\s+CallTracker\s*\(/,
    severity: "error",
    code: "DEP0173",
    since: "25",
    title: "assert.CallTracker was removed",
    fix: "Use mock functions from node:test (mock.fn()) to count calls.",
  },
  {
    re: /["']multipleResolves["']/,
    severity: "error",
    code: "DEP0160",
    since: "25",
    title: "process.on('multipleResolves') was removed",
    fix: "The event no longer fires — remove the listener.",
  },
  {
    re: /\.terminate\s*\(\s*(?:function|\(|[A-Za-z_$][\w$]*\s*=>)/,
    severity: "error",
    code: "DEP0132",
    since: "25",
    title: "worker.terminate(callback) was removed",
    fix: "Use the returned promise: await worker.terminate().",
  },
  {
    re: /\bassert\.fail\s*\(\s*[A-Za-z_$][\w$.]*\s*,/,
    severity: "warning",
    code: "DEP0094",
    since: "25",
    title: "assert.fail() with more than one argument was removed",
    fix: "Call assert.fail(message) with one argument, or use assert.strictEqual().",
  },
  {
    re: /\._channel\b/,
    severity: "warning",
    code: "DEP0129",
    since: "25",
    title: "ChildProcess._channel was removed",
    fix: "Use child.channel.",
  },
  {
    re: /generateKeyPair(?:Sync)?\s*\(\s*["']rsa-pss["'][\s\S]{0,300}?\b(?:hash|mgf1Hash)\s*:/,
    severity: "info",
    code: "DEP0154",
    since: "25",
    title: "RSA-PSS key generation options hash / mgf1Hash were removed",
    fix: "Use hashAlgorithm and mgf1HashAlgorithm.",
  },
  // ── removed in 24 ──
  {
    re: /\b(?:tls\.)?createSecurePair\s*\(|\bSecurePair\b/,
    severity: "error",
    code: "DEP0064",
    since: "24",
    title: "tls.createSecurePair() / SecurePair were removed",
    fix: "Use new tls.TLSSocket(socket, options).",
  },
  {
    re: /\._headers\b|\._headerNames\b/,
    severity: "warning",
    code: "DEP0066",
    since: "24",
    title: "OutgoingMessage._headers / _headerNames were removed",
    fix: "Use res.getHeaders(), res.getHeaderNames(), res.setHeader() and res.removeHeader().",
  },
  {
    re: /\btimers\.(enroll|unenroll|active|_unrefActive)\s*\(/,
    severity: "error",
    code: "DEP0095",
    since: "24",
    title: "timers.enroll() / unenroll() / active() / _unrefActive() were removed",
    fix: "Use setTimeout() / clearTimeout() and timeout.refresh().",
  },
  {
    re: /\bdirent\.path\b/,
    severity: "warning",
    code: "DEP0178",
    since: "24",
    title: "dirent.path was removed",
    fix: "Use dirent.parentPath (path.join(dirent.parentPath, dirent.name) for the full path).",
  },
  // ── removed in 23 ──
  {
    re: new RegExp(`\\butil\\.is(?:${UTIL_IS})\\s*\\(`),
    severity: "error",
    code: "DEP0044–58",
    since: "23",
    title: "util.isBoolean() / isString() / isFunction() … were removed",
    fix: "Use typeof checks, Array.isArray(), Buffer.isBuffer() or `instanceof`. (util.isArray stays as an alias of Array.isArray but is deprecated.)",
  },
  {
    re: /\butil\.log\s*\(/,
    severity: "error",
    code: "DEP0059",
    since: "23",
    title: "util.log() was removed",
    fix: "Use console.log() (add your own timestamp) or a logger.",
  },
  {
    re: /\bprocess\.assert\s*\(/,
    severity: "error",
    code: "DEP0100",
    since: "23",
    title: "process.assert() was removed",
    fix: "Use the node:assert module.",
  },
  // ── runtime deprecations from 24/25 still worth fixing now ──
  {
    re: /\b(?:spawn|execFile)(?:Sync)?\s*\([^)]*\[[^\]]*\][^)]*\bshell\s*:\s*true/,
    severity: "warning",
    code: "DEP0190",
    since: "24",
    title: "Passing args together with shell: true is deprecated",
    fix: "The args aren't escaped, which allows shell injection. Drop shell: true, or build one escaped command string yourself.",
  },
  {
    re: /(?<!new\s)\bzlib\.(Gzip|Gunzip|Deflate|Inflate|DeflateRaw|InflateRaw|Unzip|BrotliCompress|BrotliDecompress)\s*\(/,
    severity: "warning",
    code: "DEP0184",
    since: "24",
    title: "Calling zlib classes without new is deprecated",
    fix: "Use new zlib.Gzip() — or the factory zlib.createGzip().",
  },
  {
    re: /createHash\s*\(\s*["']shake(?:128|256)["']\s*\)/,
    severity: "warning",
    code: "DEP0198",
    since: "25",
    title: "SHAKE digests without outputLength are deprecated",
    fix: "Pass { outputLength: n } to createHash('shake256', …).",
  },
  {
    re: /\burl\.parse\s*\(/,
    severity: "info",
    code: "DEP0170",
    since: "25",
    title: "url.parse() is legacy and now throws on invalid ports",
    fix: "Use new URL(input, base) — the WHATWG parser the rest of the platform uses.",
  },
  // ── behaviour changes ──
  {
    re: /--experimental-transform-types/,
    severity: "error",
    since: "26",
    title: "--experimental-transform-types was removed",
    fix: "Node now only strips types. Rewrite enums / namespaces / parameter properties (see the Type-Stripping Checker), or run the file through tsx or tsc.",
  },
  {
    re: /--experimental-strip-types/,
    severity: "info",
    since: "23.6",
    title: "--experimental-strip-types is no longer needed",
    fix: "Type stripping is on by default — node file.ts just works for erasable syntax.",
  },
  {
    re: /--trace-atomics-wait/,
    severity: "error",
    code: "DEP0165",
    since: "23",
    title: "--trace-atomics-wait was removed",
    fix: "Remove the flag.",
  },
  {
    re: /(?<![.\w])localStorage\b/,
    severity: "info",
    since: "26",
    title: "localStorage is undefined in Node unless --localstorage-file is set",
    fix: "Code that checks typeof localStorage to detect a browser keeps working; code that uses it on the server needs --localstorage-file=<path>.",
  },
  {
    re: /@js-temporal\/polyfill|temporal-polyfill/,
    severity: "info",
    since: "26",
    title: "Temporal is built in now",
    fix: "Node 26 ships Temporal enabled by default (as do Chrome and Firefox), so server-only code can drop the polyfill. Keep it for browsers that still lack it.",
  },
];

// Packages with compiled code tied to one Node ABI (NODE_MODULE_VERSION 147 in Node 26) — they need
// a release with Node 26 binaries, or a rebuild. Packages built on Node-API (sharp, sqlite3,
// @parcel/watcher…) keep working.
const ABI_PACKAGES: Record<string, string> = {
  "better-sqlite3": "Ships binaries per Node version — update to a release that lists Node 26, then reinstall.",
  canvas: "Built against a specific Node ABI — reinstall after upgrading (needs a release with Node 26 prebuilds or a build toolchain).",
  "isolated-vm": "Tied to V8 internals — needs a release that supports Node 26 / V8 14.6.",
  re2: "Native addon — reinstall after upgrading so it builds for Node 26.",
  deasync: "Hooks into the event loop natively — test carefully on Node 26, it breaks often between majors.",
};

const DEAD_PACKAGES: Record<string, string> = {
  "node-sass": "node-sass is deprecated and has no Node 26 binaries. Switch to sass (Dart Sass) — it's a drop-in for most projects.",
  fibers: "fibers stopped working in Node 16. Remove it (Meteor and old Gatsby setups used it).",
};

export function checkPackageJson(text: string): Node26Finding[] {
  const out: Node26Finding[] = [];
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text);
  } catch {
    return [{ severity: "error", since: "", title: "package.json isn't valid JSON", fix: "Fix the JSON first (the JSON Formatter shows the exact position).", source: "package.json" }];
  }
  const lineOf = (needle: string) => {
    const i = text.indexOf(needle);
    return i < 0 ? undefined : text.slice(0, i).split("\n").length;
  };

  const engines = (pkg.engines as Record<string, string> | undefined)?.node;
  if (engines) {
    const range = semver.validRange(engines);
    if (!range) out.push({ severity: "warning", since: "26", title: `engines.node "${engines}" isn't a valid range`, fix: 'Use a range like ">=22" or "^22 || ^24 || ^26".', line: lineOf('"engines"'), source: "package.json" });
    else if (!semver.satisfies("26.0.0", range)) {
      out.push({
        severity: "error",
        since: "26",
        title: `engines.node "${engines}" excludes Node 26`,
        fix: `npm warns (and pnpm/yarn with engine-strict refuse) on Node 26. Widen it, e.g. "${semver.satisfies("22.0.0", range) ? ">=22" : ">=24"}".`,
        line: lineOf('"engines"'),
        source: "package.json",
      });
    } else out.push({ severity: "info", since: "26", title: `engines.node "${engines}" allows Node 26`, fix: "Nothing to change.", line: lineOf('"engines"'), source: "package.json" });
  } else {
    out.push({ severity: "info", since: "26", title: "No engines.node field", fix: 'Add "engines": { "node": ">=22" } (or your minimum) so installs on unsupported versions warn early.', source: "package.json" });
  }

  const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {};
  for (const [name, cmd] of Object.entries(scripts)) {
    for (const rule of CODE_RULES.filter((r) => r.title.startsWith("--"))) {
      if (rule.re.test(cmd)) out.push({ severity: rule.severity, code: rule.code, since: rule.since, title: `${rule.title} (script "${name}")`, fix: rule.fix, line: lineOf(`"${name}"`), source: "package.json" });
    }
    if (/NODE_OPTIONS=.*--openssl-legacy-provider/.test(cmd)) out.push({ severity: "info", since: "17", title: `--openssl-legacy-provider in "${name}"`, fix: "Only needed for very old webpack 4 builds — try removing it.", line: lineOf(`"${name}"`), source: "package.json" });
  }

  const deps = { ...(pkg.dependencies as object), ...(pkg.devDependencies as object), ...(pkg.optionalDependencies as object) } as Record<string, string>;
  for (const [name, version] of Object.entries(deps)) {
    if (DEAD_PACKAGES[name]) out.push({ severity: "error", since: "26", title: `${name} doesn't work on Node 26`, fix: DEAD_PACKAGES[name], line: lineOf(`"${name}"`), source: "package.json" });
    if (ABI_PACKAGES[name]) out.push({ severity: "warning", since: "26", title: `${name} is a native addon`, fix: ABI_PACKAGES[name], line: lineOf(`"${name}"`), source: "package.json" });
    if (name === "@types/node") {
      const min = semver.validRange(version) ? semver.minVersion(version) : null;
      if (min && min.major < 26) out.push({ severity: "info", since: "26", title: `@types/node ${version}`, fix: "Bump to ^26 when you switch, so types match the runtime (Temporal, removed APIs).", line: lineOf('"@types/node"'), source: "package.json" });
    }
    if ((name === "@js-temporal/polyfill" || name === "temporal-polyfill") && !out.some((f) => f.title === "Temporal is built in now")) {
      out.push({ severity: "info", since: "26", title: "Temporal is built in now", fix: "Node 26 ships Temporal enabled by default, so server-only code can drop the polyfill. Keep it for browsers that still lack it.", line: lineOf(`"${name}"`), source: "package.json" });
    }
  }
  if (Object.keys(deps).length) {
    out.push({ severity: "info", since: "26", title: "Do a clean install on Node 26", fix: "Node 26 uses NODE_MODULE_VERSION 147, so compiled dependencies from an older install fail with \"was compiled against a different Node.js version\". Delete node_modules and run npm ci on the new version (also in CI caches and Docker layers).", source: "package.json" });
  }
  return out;
}

export function checkCode(text: string): Node26Finding[] {
  const out: Node26Finding[] = [];
  const lines = text.split(/\r?\n/);
  // Skip obvious comments so documented examples don't count
  const code = lines.map((l) => (/^\s*(\/\/|\*|\/\*)/.test(l) ? "" : l));
  for (const rule of CODE_RULES) {
    const flags = rule.re.flags.includes("g") ? rule.re.flags : rule.re.flags + "g";
    const seen = new Set<number>();
    // Single-line pass gives accurate line numbers; multi-line patterns fall back to a whole-text match
    code.forEach((l, i) => {
      if (new RegExp(rule.re.source, rule.re.flags).test(l)) seen.add(i + 1);
    });
    if (!seen.size) {
      const m = new RegExp(rule.re.source, flags).exec(code.join("\n"));
      if (m) seen.add(code.join("\n").slice(0, m.index).split("\n").length);
    }
    for (const line of Array.from(seen)) out.push({ severity: rule.severity, code: rule.code, since: rule.since, title: rule.title, fix: rule.fix, line, source: "code" });
  }
  return out.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
}

const ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
export const sortFindings = (f: Node26Finding[]) => [...f].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || (a.line ?? 0) - (b.line ?? 0));
