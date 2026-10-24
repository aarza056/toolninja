import { scanForSecrets } from "@/lib/secret-scanner";

// MCP server configs: one form → the right file for each client, and a validator for pasted files.
// Formats checked against each client's docs (October 2026):
//   Claude Code  .mcp.json            { mcpServers: { name: { type, command, args, env } | { type: "http", url, headers } } }, ${VAR} / ${VAR:-default}
//   Claude Desktop claude_desktop_config.json  { mcpServers: { name: { command, args, env } } } — local servers only
//   Cursor       .cursor/mcp.json     { mcpServers: { name: { command, args, env } | { url, headers } } }, ${env:VAR}
//   VS Code      .vscode/mcp.json     { servers: { name: { type, … } }, inputs: [...] }, ${input:id}
//   Devin Desktop (formerly Windsurf) mcp_config.json  { mcpServers: { name: { command… } | { serverUrl, headers } } }, ${env:VAR}

export type McpClient = "claude-code" | "claude-desktop" | "cursor" | "vscode" | "devin";
export type Transport = "stdio" | "http" | "sse";

export interface KeyValue {
  key: string;
  value: string;
}

export interface McpServerForm {
  name: string;
  transport: Transport;
  command: string;
  args: string[];
  env: KeyValue[];
  url: string;
  headers: KeyValue[];
  /** Replace secret-looking values with the client's variable syntax */
  secretsAsVariables: boolean;
}

export const CLIENTS: { id: McpClient; label: string; file: string; where: string }[] = [
  { id: "claude-code", label: "Claude Code", file: ".mcp.json", where: "Project root (shared with your team via git). VS Code's Copilot agent also reads this file." },
  { id: "claude-desktop", label: "Claude Desktop", file: "claude_desktop_config.json", where: "macOS: ~/Library/Application Support/Claude/ · Windows: %APPDATA%\\Claude\\ — or Settings → Developer → Edit Config" },
  { id: "cursor", label: "Cursor", file: ".cursor/mcp.json", where: "Project: .cursor/mcp.json · Everywhere: ~/.cursor/mcp.json" },
  { id: "vscode", label: "VS Code", file: ".vscode/mcp.json", where: "Workspace: .vscode/mcp.json · or run “MCP: Open User Configuration”" },
  { id: "devin", label: "Devin Desktop (Windsurf)", file: "mcp_config.json", where: "macOS/Linux: ~/.config/devin/ · Windows: %APPDATA%\\devin\\" },
];

const SECRET_NAME = /(token|secret|password|passwd|api[_-]?key|apikey|auth|credential|private[_-]?key|bearer)/i;
const VARIABLE = /\$\{[^}]+\}/;

export function looksSecret(key: string, value: string): boolean {
  if (!value || VARIABLE.test(value)) return false;
  if (scanForSecrets(value).length) return true;
  return SECRET_NAME.test(key) && value.length >= 8 && !/^(true|false|\d+)$/i.test(value);
}

function envVarName(key: string): string {
  return key.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase() || "SECRET";
}

function variable(client: McpClient, name: string): string {
  if (client === "claude-code") return `\${${name}}`;
  if (client === "vscode") return `\${input:${name.toLowerCase().replace(/_/g, "-")}}`;
  if (client === "cursor" || client === "devin") return `\${env:${name}}`;
  return name; // Claude Desktop has no interpolation
}

const toObj = (kvs: KeyValue[]) => Object.fromEntries(kvs.filter((kv) => kv.key.trim()).map((kv) => [kv.key.trim(), kv.value]));

export interface Generated {
  json: string;
  /** Ready-to-run CLI command, when the client has one */
  command?: string;
  notes: string[];
}

export function generateConfig(form: McpServerForm, client: McpClient): Generated {
  const name = form.name.trim() || "my-server";
  const notes: string[] = [];
  const inputs: { type: "promptString"; id: string; description: string; password: true }[] = [];

  const secretify = (kvs: KeyValue[], forHeader: boolean): KeyValue[] =>
    kvs.map((kv) => {
      if (!form.secretsAsVariables || client === "claude-desktop" || !looksSecret(kv.key, kv.value)) return kv;
      const varName = envVarName(forHeader ? `${name}_${kv.key}` : kv.key);
      const ref = variable(client, varName);
      if (client === "vscode") inputs.push({ type: "promptString", id: ref.slice(8, -1), description: `${kv.key} for ${name}`, password: true });
      // Keep a "Bearer " prefix outside the variable
      const bearer = /^bearer\s+/i.exec(kv.value);
      return { key: kv.key, value: bearer ? `${bearer[0]}${ref}` : ref };
    });

  const env = toObj(secretify(form.env, false));
  const headers = toObj(secretify(form.headers, true));
  const args = form.args.map((a) => a.trim()).filter(Boolean);
  const remote = form.transport !== "stdio";
  let server: Record<string, unknown>;

  if (!remote) {
    server = { command: form.command.trim(), ...(args.length ? { args } : {}), ...(Object.keys(env).length ? { env } : {}) };
    if (client === "claude-code" || client === "vscode" || client === "cursor") server = { type: "stdio", ...server };
  } else if (client === "claude-desktop") {
    // The config file only launches local processes; bridge a remote server through mcp-remote
    const bridgeArgs = ["-y", "mcp-remote", form.url.trim()];
    for (const [k, v] of Object.entries(headers)) bridgeArgs.push("--header", `${k}:${v}`);
    server = { command: "npx", args: bridgeArgs };
    notes.push("Claude Desktop's config file only starts local servers. The easiest way to add a remote server is Settings → Connectors → Add custom connector; the entry below bridges it through the mcp-remote package instead.");
  } else {
    const urlKey = client === "devin" ? "serverUrl" : "url";
    server = {
      ...(client === "cursor" || client === "devin" ? {} : { type: form.transport }),
      [urlKey]: form.url.trim(),
      ...(Object.keys(headers).length ? { headers } : {}),
    };
  }

  const root = client === "vscode" ? { ...(inputs.length ? { inputs } : {}), servers: { [name]: server } } : { mcpServers: { [name]: server } };

  let command: string | undefined;
  if (client === "claude-code") {
    const q = (s: string) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);
    if (remote) {
      const h = Object.entries(headers).map(([k, v]) => ` --header ${q(`${k}: ${v}`)}`).join("");
      command = `claude mcp add --transport ${form.transport} ${q(name)} ${q(form.url.trim())}${h}`;
    } else {
      const e = Object.entries(env).map(([k, v]) => ` --env ${q(`${k}=${v}`)}`).join("");
      command = `claude mcp add --transport stdio${e} ${q(name)} -- ${[form.command.trim(), ...args].map(q).join(" ")}`;
    }
    notes.push("The command adds the server for you only; add --scope project to write it to .mcp.json for everyone.");
    if (Object.values({ ...env, ...headers }).some((v) => VARIABLE.test(v))) notes.push("Variables like ${NAME} are read from your shell environment when Claude Code starts.");
  }
  if (client === "vscode" && inputs.length) notes.push("VS Code asks for each input the first time the server starts and stores it securely.");
  if ((client === "cursor" || client === "devin") && Object.values({ ...env, ...headers }).some((v) => VARIABLE.test(v))) {
    notes.push("${env:NAME} is read from the environment the app was started from — set it in your shell profile or system environment variables.");
  }
  if (client === "claude-desktop" && [...form.env, ...form.headers].some((kv) => looksSecret(kv.key, kv.value))) {
    notes.push("Claude Desktop can't read variables, so secrets sit in this file as plain text. It lives in your user folder — never commit or share it.");
  }
  if (!remote && /^(npx|uvx|npm|pnpm|bunx)$/.test(form.command.trim()) && client === "claude-desktop") {
    notes.push("On Windows, if the server fails with \"spawn npx ENOENT\", use \"command\": \"cmd\" with \"/c\", \"npx\" as the first args.");
  }

  return { json: JSON.stringify(root, null, 2), command, notes };
}

// ─── validation ──────────────────────────────────────────────────────────────

export type IssueLevel = "error" | "warning" | "info";
export interface Issue {
  level: IssueLevel;
  server?: string;
  message: string;
}

/** Explains a JSON.parse failure with the usual causes in hand-edited config files. */
export function explainJsonError(text: string, e: unknown): Issue {
  const msg = e instanceof Error ? e.message : String(e);
  const pos = Number(/position (\d+)/.exec(msg)?.[1] ?? NaN);
  const line = Number.isFinite(pos) ? text.slice(0, pos).split("\n").length : Number(/line (\d+)/.exec(msg)?.[1] ?? NaN);
  const hints: string[] = [];
  if (/,\s*[}\]]/.test(text)) hints.push("there's a trailing comma before a } or ] — JSON doesn't allow them");
  if (/^\s*\/\/|\/\*/m.test(text)) hints.push("comments (// or /* */) aren't allowed in JSON");
  if (/'[^'\n]*'\s*:/.test(text)) hints.push("keys and strings need double quotes, not single quotes");
  if (/"[A-Za-z]:\\(?!\\)/.test(text) || /[^\\]\\[^\\"\/bfnrtu]/.test(text)) hints.push('Windows paths need doubled backslashes ("C:\\\\Users\\\\…") or forward slashes ("C:/Users/…")');
  return {
    level: "error",
    message: `Invalid JSON${Number.isFinite(line) ? ` near line ${line}` : ""}: ${msg.replace(/^JSON\.parse: /, "")}${hints.length ? `. Likely cause: ${hints.join("; ")}.` : ""}`,
  };
}

const KNOWN_KEYS = new Set(["type", "command", "args", "env", "envFile", "cwd", "url", "headers", "serverUrl", "httpUrl", "disabled", "timeout", "oauth", "alwaysAllow", "autoApprove", "disabledTools"]);

export function validateConfig(text: string, client: McpClient): Issue[] {
  const issues: Issue[] = [];
  if (!text.trim()) return issues;
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return [explainJsonError(text, e)];
  }
  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return [{ level: "error", message: "The file must be a JSON object." }];
  const root = doc as Record<string, unknown>;
  const wantKey = client === "vscode" ? "servers" : "mcpServers";
  const otherKey = client === "vscode" ? "mcpServers" : "servers";
  let servers = root[wantKey];

  if (servers === undefined) {
    if (root[otherKey] !== undefined) {
      if (client === "vscode") {
        issues.push({ level: "warning", message: "Uses mcpServers — that's the portable format VS Code reads from .mcp.json. In .vscode/mcp.json the key must be \"servers\"." });
      } else {
        issues.push({ level: "error", message: `Uses "servers" (VS Code's format). ${CLIENTS.find((c) => c.id === client)!.label} expects "mcpServers".` });
      }
      servers = root[otherKey];
    } else if (Object.values(root).some((v) => v && typeof v === "object" && ("command" in (v as object) || "url" in (v as object)))) {
      issues.push({ level: "error", message: `Servers must be wrapped in a "${wantKey}" object: { "${wantKey}": { "name": { … } } }.` });
      servers = root;
    } else {
      return [{ level: "error", message: `No "${wantKey}" section found.` }];
    }
  }
  if (typeof servers !== "object" || servers === null || Array.isArray(servers)) return [...issues, { level: "error", message: `"${wantKey}" must be an object keyed by server name, not ${Array.isArray(servers) ? "an array" : typeof servers}.` }];
  const entries = Object.entries(servers as Record<string, unknown>);
  if (!entries.length) issues.push({ level: "warning", message: "No servers are defined." });

  const inputIds = new Set(Array.isArray(root.inputs) ? (root.inputs as { id?: string }[]).map((i) => i?.id).filter(Boolean) : []);

  for (const [name, raw] of entries) {
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null) as Record<string, unknown> | null;
    if (!s) {
      issues.push({ level: "error", server: name, message: "Must be an object." });
      continue;
    }
    const err = (message: string) => issues.push({ level: "error", server: name, message });
    const warn = (message: string) => issues.push({ level: "warning", server: name, message });
    const info = (message: string) => issues.push({ level: "info", server: name, message });

    const hasCommand = s.command !== undefined;
    const urlKeys = ["url", "serverUrl", "httpUrl"].filter((k) => s[k] !== undefined);
    if (hasCommand && urlKeys.length) err(`Has both "command" and "${urlKeys[0]}" — a server is either local (command) or remote (url), not both.`);
    if (!hasCommand && !urlKeys.length) err('Needs either "command" (local server) or "url" (remote server).');

    for (const k of Object.keys(s)) {
      if (!KNOWN_KEYS.has(k)) {
        const guess = { cmd: "command", arguments: "args", argv: "args", environment: "env", envs: "env", header: "headers", endpoint: "url", uri: "url", transport: "type" }[k];
        warn(`Unknown key "${k}"${guess ? ` — did you mean "${guess}"?` : " — clients ignore it."}`);
      }
    }

    const type = s.type;
    if (type !== undefined && !["stdio", "http", "sse", "streamable-http"].includes(String(type))) err(`"type": "${type}" isn't valid — use "stdio", "http" or "sse".`);
    if (type === "streamable-http" && client !== "claude-code") warn('"streamable-http" is a Claude Code alias; use "http" here.');

    if (hasCommand) {
      if (typeof s.command !== "string" || !s.command.trim()) err('"command" must be a non-empty string.');
      else if (/\s/.test(s.command.trim())) {
        // A whole command line in "command" — unless it's a program path that happens to contain spaces
        const words = s.command.trim().split(/\s+/);
        const launcher = /^(npx|uvx|uv|node|python3?|deno|bun|bunx|npm|pnpm|yarn|docker|java|dotnet|go|cmd)(\.exe|\.cmd)?$/i.test(words[0]);
        if (launcher || words.slice(1).some((w) => w.startsWith("-"))) {
          err(`"command" contains a whole command line ("${s.command}"). Put only the program in command and everything else in args: "command": "${words[0]}", "args": [${words.slice(1).map((a) => JSON.stringify(a)).join(", ")}].`);
        } else {
          info(`"command" contains spaces. That's fine for a program path like "C:\\Program Files\\…", but arguments belong in "args".`);
        }
      }
      if (s.args !== undefined && (!Array.isArray(s.args) || s.args.some((a) => typeof a !== "string"))) err('"args" must be an array of strings, e.g. ["-y", "@scope/server"].');
      if ((type === "http" || type === "sse") && hasCommand) err(`"type": "${type}" is for remote servers, but this one has a command.`);
      if (client === "vscode" && type === undefined) err('VS Code needs "type": "stdio" on every local server.');
    }
    if (urlKeys.length) {
      const key = urlKeys[0];
      const value = String(s[key]);
      if (client === "claude-desktop") err("Claude Desktop's config file can't connect to remote servers. Add it in Settings → Connectors, or bridge it with npx mcp-remote <url>.");
      if (key === "httpUrl") warn('"httpUrl" is Gemini CLI\'s key; this client expects "url".');
      if (key === "serverUrl" && client !== "devin") warn('"serverUrl" is Devin Desktop/Windsurf\'s key; this client expects "url".');
      if (key === "url" && client === "devin") info('Devin Desktop accepts "url", but its docs use "serverUrl".');
      if (client === "claude-code" && type === undefined) err('Claude Code reads an entry without "type" as a local server, so this remote server won\'t load. Add "type": "http".');
      if (client === "vscode" && type === undefined) err('VS Code needs "type": "http" (or "sse") on remote servers.');
      if (!VARIABLE.test(value)) {
        try {
          const u = new URL(value);
          if (!/^https?:$/.test(u.protocol)) err(`URL must start with http:// or https:// (got ${u.protocol}).`);
          else if (u.protocol === "http:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname)) warn("Uses plain http:// to a remote host — tokens in headers travel unencrypted. Use https://.");
        } catch {
          err(`"${key}" isn't a valid URL: ${value}`);
        }
      }
    }

    for (const field of ["env", "headers"] as const) {
      const obj = s[field];
      if (obj === undefined) continue;
      if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        err(`"${field}" must be an object of "NAME": "value" pairs.`);
        continue;
      }
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v !== "string") err(`${field}.${k} must be a string (wrap numbers and booleans in quotes).`);
        else if (looksSecret(k, v)) warn(`${field}.${k} holds a secret in plain text. ${secretAdvice(client)}`);
      }
    }
    if (Array.isArray(s.args)) {
      for (const a of s.args) if (typeof a === "string" && scanForSecrets(a).length) warn(`An argument contains what looks like a key or token. ${secretAdvice(client)}`);
    }

    // Variable syntax belongs to one client each
    const blob = JSON.stringify(s);
    for (const m of blob.match(/\$\{[^}]+\}/g) ?? []) {
      const inner = m.slice(2, -1);
      if (inner.startsWith("input:")) {
        if (client !== "vscode") warn(`${m} is VS Code syntax; ${CLIENTS.find((c) => c.id === client)!.label} won't replace it.`);
        else if (!inputIds.has(inner.slice(6))) err(`${m} has no matching entry in "inputs".`);
      } else if (inner.startsWith("env:")) {
        if (client === "claude-code") warn(`${m} is Cursor/Devin syntax; Claude Code expects \${${inner.slice(4)}}.`);
        else if (client === "claude-desktop") warn(`Claude Desktop doesn't expand ${m}.`);
      } else if (/^[A-Za-z_][A-Za-z0-9_]*(:-.*)?$/.test(inner)) {
        if (client === "cursor" || client === "devin") warn(`${m} won't be replaced here — use \${env:${inner.split(":-")[0]}}.`);
        else if (client === "claude-desktop") warn(`Claude Desktop doesn't expand ${m}.`);
        else if (client === "vscode") warn(`VS Code doesn't read ${m} from the environment — use \${input:…} or envFile.`);
      }
    }
  }
  return issues;
}

function secretAdvice(client: McpClient): string {
  if (client === "claude-code") return "Use ${NAME} and set NAME in your environment, so the file can be committed safely.";
  if (client === "vscode") return 'Use an "inputs" entry with "password": true and reference it as ${input:id}.';
  if (client === "cursor" || client === "devin") return "Use ${env:NAME} and set NAME in your environment.";
  return "Claude Desktop can't read variables — keep this file private and never commit it.";
}

export const EMPTY_FORM: McpServerForm = {
  name: "github",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: [{ key: "GITHUB_PERSONAL_ACCESS_TOKEN", value: "ghp_your_token_here" }],
  url: "https://example.com/mcp",
  headers: [{ key: "Authorization", value: "Bearer your-token" }],
  secretsAsVariables: true,
};
