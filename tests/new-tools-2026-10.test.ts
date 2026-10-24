import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import yaml from "js-yaml";
import { decodeMigration, encodeMigration, accountToOtpauth, type MigrationAccount } from "@/lib/otpauth-migration";
import { parseOtpauthUrl } from "@/lib/totp";
import { jsonToCode } from "@/lib/json-to-code";
import { ACTIONS, DEFAULT_GHA_OPTIONS, generateWorkflow, dependabotConfig, type GhaOptions } from "@/lib/gha-gen";
import { auditWorkflow, findActionUses, pinWorkflow } from "@/lib/gha-audit";
import { generateConfig, validateConfig, EMPTY_FORM, CLIENTS, type McpServerForm } from "@/lib/mcp-config";
import { checkSchema, fixSchema, unwrapSchema } from "@/lib/llm-schema";
import { analyzeSpf, analyzeDmarc, lookupDkim, rsaKeyBits, joinTxt, buildSpf, buildDmarc, normalizeDomain, orgDomain, type Resolver, type DnsAnswer } from "@/lib/email-auth";
import { checkCode, checkPackageJson } from "@/lib/node26-checker";
import { parseCron, nextRuns, describe as describeCron, convert, minGapMs, partsIn } from "@/lib/cron";
import { parseTimestamp, relativeTime, isoInZone, snippets, formats, wallTimeToEpoch } from "@/lib/timestamp";
import { customizeCss, toTailwindTheme, DEFAULT_ANIMATION_OPTIONS } from "@/lib/animation-customize";
import { detectLocal } from "@/lib/detect";

// ─── Google Authenticator export ──────────────────────────────────────────────

describe("Google Authenticator export decoder", () => {
  // Widely published sample export: one TOTP account, secret "Hello!\xde\xad\xbe\xef"
  const SAMPLE = "otpauth-migration://offline?data=CjEKCkhlbGxvId6tvu8SGEV4YW1wbGU6YWxpY2VAZ29vZ2xlLmNvbRoHRXhhbXBsZTAC";

  it("decodes the sample export", () => {
    const { accounts } = decodeMigration(SAMPLE);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ secret: "JBSWY3DPEHPK3PXP", account: "alice@google.com", issuer: "Example", type: "totp", algorithm: "SHA-1", digits: 6 });
  });

  it("produces a standard otpauth link other apps can import", () => {
    const url = accountToOtpauth(decodeMigration(SAMPLE).accounts[0]);
    const parsed = parseOtpauthUrl(url)!;
    expect(parsed.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(parsed.issuer).toBe("Example");
    expect(parsed.label).toBe("alice@google.com");
  });

  it("round-trips HOTP, SHA-256, 8 digits and non-ASCII names", () => {
    const accounts: MigrationAccount[] = [
      { secret: "JBSWY3DPEHPK3PXP", account: "alice@example.com", issuer: "GitHub", algorithm: "SHA-1", digits: 6, type: "totp", counter: 0 },
      { secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", account: "Ашот", issuer: "Bank ✓", algorithm: "SHA-256", digits: 8, type: "hotp", counter: 300 },
    ];
    const back = decodeMigration(encodeMigration(accounts, { index: 0, size: 1, id: 42 }));
    expect(back.accounts).toEqual(accounts);
    expect(back.batchId).toBe(42);
  });

  it("explains wrong input", () => {
    expect(() => decodeMigration("otpauth://totp/x?secret=ABC")).toThrow(/single-account/);
    expect(() => decodeMigration("otpauth-migration://offline?foo=1")).toThrow(/data=/);
    expect(() => decodeMigration("otpauth-migration://offline?data=%%%")).toThrow();
  });
});

// ─── JSON → code ─────────────────────────────────────────────────────────────

describe("JSON to code", () => {
  const SAMPLE = JSON.stringify({
    id: 1,
    "first-name": "Ada",
    type: "admin",
    createdAt: "2026-10-24T10:00:00Z",
    tags: ["a"],
    users: [
      { id: 1, email: "a@x.io", score: 1 },
      { id: 2, score: 2.5, nickname: null },
    ],
  });

  it("merges array items: missing fields become optional, int + float becomes float", () => {
    const go = jsonToCode(SAMPLE, "go");
    expect(go).toMatch(/type User struct/);
    expect(go).toMatch(/Email\s+\*string\s+`json:"email,omitempty"`/);
    expect(go).toMatch(/Score\s+float64\s+`json:"score"`/);
    expect(go).toMatch(/CreatedAt\s+time\.Time/);
    expect(go).toContain('import "time"');
  });

  it("Pydantic aliases keys that aren't valid Python names", () => {
    const py = jsonToCode(SAMPLE, "pydantic");
    expect(py).toContain('first_name: str = Field(alias="first-name")');
    expect(py).toContain("model_config = ConfigDict(populate_by_name=True)");
    expect(py).toContain("email: str | None = None");
    expect(py).toContain("users: list[User]");
    // classes are defined before they're used
    expect(py.indexOf("class User(")).toBeLessThan(py.indexOf("class Root("));
  });

  it("dataclasses put defaulted fields last and never emit List[A, B]", () => {
    const py = jsonToCode(JSON.stringify({ items: [{ a: 1 }, { b: "x" }], mixed: [1, "a"] }), "dataclass");
    expect(py).not.toMatch(/List\[[^\]]+,/);
    expect(py).toContain("mixed: list[Any]");
    const body = py.slice(py.indexOf("class Item"));
    expect(body.indexOf("a: int | None = None")).toBeGreaterThan(-1);
  });

  it("Rust escapes keywords and renames fields", () => {
    const rs = jsonToCode(SAMPLE, "rust");
    expect(rs).toContain("pub r#type: String,");
    expect(rs).toContain('#[serde(rename = "first-name")]');
    expect(rs).toMatch(/pub email: Option<String>,/);
  });

  it("C#, Kotlin and Swift", () => {
    const cs = jsonToCode(SAMPLE, "csharp");
    expect(cs).toContain('[JsonPropertyName("first-name")]');
    expect(cs).toContain("public required string FirstName { get; set; }");
    expect(cs).toContain("public string? Email { get; set; }");
    const kt = jsonToCode(SAMPLE, "kotlin");
    expect(kt).toContain('@SerialName("first-name") val firstName: String,');
    expect(kt).toContain("val email: String? = null,");
    const sw = jsonToCode(SAMPLE, "swift");
    expect(sw).toContain('case firstName = "first-name"');
    expect(sw).toContain("let email: String?");
  });

  it("root arrays get an item type and an alias", () => {
    expect(jsonToCode('[{"a":1}]', "go")).toContain("type Root []RootItem");
    expect(jsonToCode('[{"a":1}]', "kotlin")).toContain("typealias Root = List<RootItem>");
  });

  it("throws on invalid JSON", () => {
    expect(() => jsonToCode("{nope}", "go")).toThrow(SyntaxError);
  });
});

// ─── GitHub Actions ──────────────────────────────────────────────────────────

describe("GitHub Actions generator hardening", () => {
  const stacks: GhaOptions["stack"][] = ["node", "python", "go", "docker"];

  it("every pinned SHA is a full commit hash", () => {
    for (const a of Object.values(ACTIONS)) expect(a.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it.each(stacks)("%s workflow is valid YAML, pinned, least-privilege and passes the audit", (stack) => {
    const wf = generateWorkflow({ ...DEFAULT_GHA_OPTIONS, stack, nodePm: "pnpm" });
    const doc = yaml.load(wf) as Record<string, unknown>;
    expect(doc.permissions).toEqual({ contents: "read" });
    for (const u of findActionUses(wf)) expect(u.pinned).toBe(true);
    expect(wf).toContain("persist-credentials: false");
    const { findings, error } = auditWorkflow(wf);
    expect(error).toBeUndefined();
    expect(findings).toEqual([]);
  });

  it("unpinned mode uses major tags", () => {
    expect(generateWorkflow({ ...DEFAULT_GHA_OPTIONS, pinShas: false })).toContain("actions/checkout@v7\n");
  });

  it("dependabot config is valid YAML for github-actions", () => {
    const d = yaml.load(dependabotConfig()) as { updates: { "package-ecosystem": string }[] };
    expect(d.updates[0]["package-ecosystem"]).toBe("github-actions");
  });
});

describe("GitHub Actions audit", () => {
  const RISKY = `name: PR
on:
  pull_request_target:
    types: [opened]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}
      - uses: tj-actions/changed-files@v45
      - run: echo "\${{ github.event.pull_request.title }}"
      - uses: some-org/deploy@9f2e1c0a7b3d4e5f60718293a4b5c6d7e8f90123
`;

  it("finds the classic problems", () => {
    const { findings } = auditWorkflow(RISKY);
    const ids = findings.map((f) => f.id);
    expect(ids).toContain("untrusted-checkout");
    expect(ids).toContain("script-injection");
    expect(ids).toContain("compromised-action");
    expect(ids).toContain("no-permissions");
    expect(ids).toContain("persist-credentials");
    expect(ids.filter((i) => i === "unpinned-action")).toHaveLength(2);
    expect(findings[0].severity).toBe("high");
    expect(findings.find((f) => f.id === "script-injection")!.line).toBe(13);
  });

  it("reports YAML errors and non-workflows", () => {
    expect(auditWorkflow("a: [").error).toBeTruthy();
    expect(auditWorkflow("name: x").error).toMatch(/jobs/);
  });

  it("pins uses: lines to resolved SHAs and keeps the tag as a comment", () => {
    const sha = "a".repeat(40);
    const out = pinWorkflow(RISKY, new Map([["actions/checkout@v4", sha]]));
    expect(out).toContain(`- uses: actions/checkout@${sha} # v4`);
    expect(out).toContain("tj-actions/changed-files@v45");
  });
});

// ─── MCP configs ─────────────────────────────────────────────────────────────

describe("MCP config builder", () => {
  const form: McpServerForm = { ...EMPTY_FORM };
  const remote: McpServerForm = { ...EMPTY_FORM, name: "linear", transport: "http", url: "https://mcp.linear.app/mcp", headers: [{ key: "Authorization", value: "Bearer lin_api_1234567890abcdef" }] };

  it("writes each client's own shape, and every generated file validates cleanly", () => {
    for (const c of CLIENTS) {
      for (const f of [form, remote]) {
        const g = generateConfig(f, c.id);
        const issues = validateConfig(g.json, c.id).filter((i) => i.level === "error");
        expect(issues, `${c.id} ${f.transport}`).toEqual([]);
      }
    }
  });

  it("uses each client's variable syntax for secrets", () => {
    expect(JSON.parse(generateConfig(form, "claude-code").json).mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe("${GITHUB_PERSONAL_ACCESS_TOKEN}");
    expect(JSON.parse(generateConfig(form, "cursor").json).mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe("${env:GITHUB_PERSONAL_ACCESS_TOKEN}");
    const vs = JSON.parse(generateConfig(form, "vscode").json);
    expect(vs.servers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe("${input:github-personal-access-token}");
    expect(vs.inputs[0]).toMatchObject({ id: "github-personal-access-token", password: true });
    expect(JSON.parse(generateConfig(remote, "claude-code").json).mcpServers.linear.headers.Authorization).toBe("Bearer ${LINEAR_AUTHORIZATION}");
  });

  it("remote servers: Devin uses serverUrl, Claude Desktop bridges through mcp-remote", () => {
    expect(JSON.parse(generateConfig(remote, "devin").json).mcpServers.linear.serverUrl).toBe("https://mcp.linear.app/mcp");
    const desk = JSON.parse(generateConfig(remote, "claude-desktop").json).mcpServers.linear;
    expect(desk.command).toBe("npx");
    expect(desk.args.slice(0, 3)).toEqual(["-y", "mcp-remote", "https://mcp.linear.app/mcp"]);
  });

  it("Claude Code CLI command", () => {
    expect(generateConfig(form, "claude-code").command).toBe("claude mcp add --transport stdio --env 'GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_PERSONAL_ACCESS_TOKEN}' github -- npx -y @modelcontextprotocol/server-github");
    expect(generateConfig(remote, "claude-code").command).toBe("claude mcp add --transport http linear https://mcp.linear.app/mcp --header 'Authorization: Bearer ${LINEAR_AUTHORIZATION}'");
  });
});

describe("MCP config validator", () => {
  it("explains trailing commas and Windows paths", () => {
    expect(validateConfig('{ "mcpServers": { "a": { "command": "node", } } }', "cursor")[0].message).toMatch(/trailing comma/);
    expect(validateConfig('{ "mcpServers": { "a": { "command": "C:\\Users\\me\\s.exe" } } }', "cursor")[0].message).toMatch(/backslashes/);
  });

  it("catches client-specific mistakes", () => {
    const msgs = (t: string, c: Parameters<typeof validateConfig>[1]) => validateConfig(t, c).map((i) => `${i.level}: ${i.message}`).join("\n");
    expect(msgs('{"mcpServers":{"x":{"url":"https://a.io/mcp"}}}', "claude-code")).toMatch(/error: .*won't load/);
    expect(msgs('{"servers":{"x":{"command":"npx"}}}', "cursor")).toMatch(/error: Uses "servers"/);
    expect(msgs('{"mcpServers":{"x":{"command":"npx -y pkg"}}}', "cursor")).toMatch(/"args": \["-y", "pkg"\]/);
    // a scoped package contains "/" but is still a whole command line
    expect(msgs('{"mcpServers":{"x":{"command":"npx -y @modelcontextprotocol/server-github"}}}', "cursor")).toMatch(/error: "command" contains a whole command line/);
    expect(msgs('{"mcpServers":{"x":{"command":"C:/Program Files/My Server/server.exe"}}}', "cursor")).toMatch(/info: "command" contains spaces/);
    expect(msgs('{"mcpServers":{"x":{"command":"npx","env":{"API_KEY":"sk-live-abcdefghijklmnop"}}}}', "cursor")).toMatch(/warning: env.API_KEY holds a secret/);
    expect(msgs('{"servers":{"x":{"type":"stdio","command":"npx","env":{"K":"${input:k}"}}}}', "vscode")).toMatch(/no matching entry in "inputs"/);
    expect(msgs('{"mcpServers":{"x":{"command":"npx","env":{"K":"${env:K}"}}}}', "claude-code")).toMatch(/Claude Code expects \$\{K\}/);
    expect(msgs('{"mcpServers":{"x":{"command":"npx","url":"https://a.io"}}}', "cursor")).toMatch(/both "command" and "url"/);
    expect(msgs('{"mcpServers":{"x":{"url":"https://a.io/mcp"}}}', "claude-desktop")).toMatch(/Connectors/);
  });
});

// ─── Structured output schemas ───────────────────────────────────────────────

describe("LLM structured output schema checker", () => {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "integer", minimum: 0 },
      email: { type: "string", format: "email" },
      tags: { type: "array", items: { type: "string" }, uniqueItems: true },
      address: { type: "object", properties: { city: { type: "string" } } },
    },
    required: ["name"],
  };

  it("OpenAI strict: required, additionalProperties and unsupported keywords", () => {
    const errors = checkSchema(schema, "openai").filter((i) => i.level === "error");
    expect(errors.some((e) => e.path === "#" && /missing: age, email, tags, address/.test(e.message))).toBe(true);
    expect(errors.some((e) => e.path === "#/properties/address" && /additionalProperties/.test(e.message))).toBe(true);
    expect(errors.some((e) => /uniqueItems/.test(e.message))).toBe(true);
  });

  it("Claude allows optional fields but not numeric/length constraints", () => {
    const issues = checkSchema(schema, "anthropic");
    expect(issues.some((i) => /must be in "required"/.test(i.message))).toBe(false);
    expect(issues.some((i) => i.level === "warning" && /"minimum"/.test(i.message))).toBe(true);
    expect(issues.some((i) => i.level === "error" && /additionalProperties/.test(i.message))).toBe(true);
  });

  it("Gemini accepts it and notes ignored keywords", () => {
    const issues = checkSchema(schema, "gemini");
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
    expect(issues.some((i) => i.level === "info" && /minLength/.test(i.message))).toBe(true);
  });

  it("auto-fix produces schemas each provider accepts", () => {
    const openai = fixSchema(schema, "openai");
    expect(checkSchema(openai.schema, "openai").filter((i) => i.level === "error")).toEqual([]);
    const props = openai.schema.properties as Record<string, { type: unknown }>;
    expect(props.age.type).toEqual(["integer", "null"]);
    expect(openai.schema.required).toEqual(["name", "age", "email", "tags", "address"]);
    const claude = fixSchema(schema, "anthropic");
    expect(checkSchema(claude.schema, "anthropic").filter((i) => i.level !== "info")).toEqual([]);
    expect(claude.schema.required).toEqual(["name"]);
  });

  it("wraps a non-object root for OpenAI and converts nullable/oneOf", () => {
    const fixed = fixSchema({ type: "array", items: { type: "string", nullable: true } }, "openai").schema;
    expect(fixed).toMatchObject({ type: "object", required: ["result"], additionalProperties: false });
    expect(fixSchema({ type: "object", properties: { a: { oneOf: [{ type: "string" }, { type: "number" }] } }, required: ["a"] }, "openai").schema).toMatchObject({ properties: { a: { anyOf: [{ type: "string" }, { type: "number" }] } } });
  });

  it("detects recursion for Claude", () => {
    const rec = { type: "object", properties: { child: { $ref: "#/$defs/node" } }, $defs: { node: { type: "object", properties: { next: { $ref: "#/$defs/node" } }, additionalProperties: false } }, additionalProperties: false };
    expect(checkSchema(rec, "anthropic").some((i) => /Recursive/.test(i.message))).toBe(true);
    expect(checkSchema(rec, "openai").some((i) => /Recursive/.test(i.message))).toBe(false);
  });

  it("unwraps response_format and tool definitions", () => {
    expect(unwrapSchema({ type: "json_schema", json_schema: { name: "x", strict: true, schema: { type: "object" } } }).wrapper).toBe("response_format.json_schema.schema");
    expect(unwrapSchema({ name: "t", input_schema: { type: "object" } }).wrapper).toBe("input_schema");
    expect(unwrapSchema({ type: "function", function: { name: "f", parameters: { type: "object" } } }).wrapper).toBe("function.parameters");
  });
});

// ─── Email authentication ────────────────────────────────────────────────────

function fakeDns(zone: Record<string, Partial<Record<"TXT" | "MX" | "A" | "AAAA", string[]>>>): Resolver {
  return async (name, type): Promise<DnsAnswer> => {
    const z = zone[name.toLowerCase()];
    if (!z) return { status: "nxdomain", records: [] };
    const r = z[type] ?? [];
    return { status: r.length ? "ok" : "nodata", records: r };
  };
}

describe("SPF / DMARC / DKIM", () => {
  it("joins chunked TXT data", () => {
    expect(joinTxt('"v=spf1 include:a.com " "-all"')).toBe("v=spf1 include:a.com -all");
    expect(joinTxt("v=DMARC1; p=none")).toBe("v=DMARC1; p=none");
  });

  it("counts lookups through nested includes", async () => {
    const dns = fakeDns({
      "example.com": { TXT: ["v=spf1 mx include:_spf.google.com include:mail.example.net ~all"], MX: ["10 mx.example.com"] },
      "_spf.google.com": { TXT: ["v=spf1 ip4:74.125.0.0/16 ~all"] },
      "mail.example.net": { TXT: ["v=spf1 include:a.example.net include:b.example.net -all"] },
      "a.example.net": { TXT: ["v=spf1 a -all"], A: ["1.2.3.4"] },
      "b.example.net": { TXT: ["v=spf1 ip4:5.6.7.8 -all"] },
    });
    const r = await analyzeSpf("example.com", dns);
    expect(r.lookups).toBe(6); // mx, include ×2, include ×2 nested, a
    expect(r.root.terms.find((t) => t.mechanism === "include")!.note).toBe("Google Workspace");
    expect(r.issues.find((i) => i.level === "ok")!.message).toMatch(/6 of 10/);
  });

  it("flags more than 10 lookups, +all, missing includes and duplicate records", async () => {
    const includes = Array.from({ length: 11 }, (_, i) => `include:s${i}.example.org`).join(" ");
    const zone: Parameters<typeof fakeDns>[0] = { "big.com": { TXT: [`v=spf1 ${includes} +all`] } };
    for (let i = 0; i < 11; i++) zone[`s${i}.example.org`] = { TXT: ["v=spf1 -all"] };
    const r = await analyzeSpf("big.com", fakeDns(zone));
    expect(r.lookups).toBe(11);
    expect(r.issues.some((i) => i.level === "error" && /11 DNS lookups/.test(i.message))).toBe(true);
    expect(r.issues.some((i) => /\+all/.test(i.message))).toBe(true);

    const r2 = await analyzeSpf("x.com", fakeDns({ "x.com": { TXT: ["v=spf1 include:gone.example ~all", "v=spf1 -all"] } }));
    expect(r2.issues.some((i) => /2 SPF records/.test(i.message))).toBe(true);
    expect(r2.issues.some((i) => /include:gone.example — No SPF record/.test(i.message))).toBe(true);

    const r3 = await analyzeSpf("none.com", fakeDns({ "none.com": { TXT: ["google-site-verification=abc"] } }));
    expect(r3.issues[0]).toMatchObject({ level: "error" });
  });

  it("DMARC: parses tags and falls back to the organisational domain", async () => {
    const dns = fakeDns({ "_dmarc.example.com": { TXT: ["v=DMARC1; p=none; sp=quarantine"] } });
    const r = await analyzeDmarc("mail.example.com", dns);
    expect(r.foundOn).toBe("example.com");
    expect(r.tags).toMatchObject({ v: "DMARC1", p: "none", sp: "quarantine" });
    expect(r.issues.some((i) => /p=none only monitors/.test(i.message))).toBe(true);
    expect(r.issues.some((i) => /No rua=/.test(i.message))).toBe(true);
    expect((await analyzeDmarc("nope.com", dns)).issues[0].level).toBe("error");
    expect(orgDomain("shop.example.co.uk")).toBe("example.co.uk");
  });

  it("DKIM: RSA key size from SPKI and PKCS#1 keys, checked against node:crypto", async () => {
    for (const bits of [1024, 2048]) {
      const { publicKey } = generateKeyPairSync("rsa", { modulusLength: bits });
      expect(rsaKeyBits(publicKey.export({ type: "spki", format: "der" }).toString("base64"))).toBe(bits);
      expect(rsaKeyBits(publicKey.export({ type: "pkcs1", format: "der" }).toString("base64"))).toBe(bits);
    }
    const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const p = publicKey.export({ type: "spki", format: "der" }).toString("base64");
    const keys = await lookupDkim("example.com", ["google", "s1"], fakeDns({ "google._domainkey.example.com": { TXT: [`v=DKIM1; k=rsa; p=${p}`] }, "s1._domainkey.example.com": { TXT: ["v=DKIM1; p="] } }));
    expect(keys.map((k) => [k.selector, k.bits, k.revoked])).toEqual([["google", 1024, false], ["s1", undefined, true]]);
    expect(keys[0].issues[0].level).toBe("warning");
  });

  it("generators", () => {
    expect(buildSpf({ providers: ["google", "sendgrid"], ip4: "203.0.113.5", ip6: "", includes: "", includeMx: false, all: "-all" })).toEqual({ record: "v=spf1 ip4:203.0.113.5 include:_spf.google.com include:sendgrid.net -all", lookups: 2 });
    expect(buildDmarc({ policy: "quarantine", subdomainPolicy: "", rua: "dmarc@example.com", ruf: "", pct: 100, adkim: "r", aspf: "s" })).toBe("v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; aspf=s");
    expect(normalizeDomain("https://WWW.Example.com/path?x")).toBe("www.example.com");
    expect(normalizeDomain("me@example.org")).toBe("example.org");
  });
});

// ─── Node 26 ─────────────────────────────────────────────────────────────────

describe("Node.js 26 upgrade checker", () => {
  it("flags removed and deprecated APIs in code with their DEP codes", () => {
    const code = [
      "const Readable = require('_stream_readable');",
      "res.writeHeader(200);",
      "import { register } from 'node:module';",
      "if (util.isString(x)) {}",
      "fs.access(p, fs.F_OK, cb);",
      "fs.rmdirSync(dir, { recursive: true });",
      "// res.writeHeader() in a comment is ignored",
      "await worker.terminate();",
    ].join("\n");
    const f = checkCode(code);
    const codes = f.map((x) => x.code);
    expect(codes).toEqual(expect.arrayContaining(["DEP0193", "DEP0063", "DEP0205", "DEP0044–58", "DEP0176", "DEP0147"]));
    expect(f.find((x) => x.code === "DEP0063")!.line).toBe(2);
    expect(f.filter((x) => x.code === "DEP0063")).toHaveLength(1);
    expect(codes).not.toContain("DEP0132"); // terminate() without a callback is fine
  });

  it("package.json: engines, removed flags, dead and native packages", () => {
    const pkg = JSON.stringify({
      name: "app",
      engines: { node: "^20 || ^22" },
      scripts: { dev: "node --experimental-transform-types src/main.ts" },
      dependencies: { "node-sass": "^9.0.0", "better-sqlite3": "^11.0.0", sharp: "^0.34.0" },
      devDependencies: { "@types/node": "^22.0.0" },
    }, null, 2);
    const f = checkPackageJson(pkg);
    const titles = f.map((x) => x.title).join("\n");
    expect(titles).toMatch(/excludes Node 26/);
    expect(titles).toMatch(/--experimental-transform-types was removed \(script "dev"\)/);
    expect(titles).toMatch(/node-sass doesn't work on Node 26/);
    expect(titles).toMatch(/better-sqlite3 is a native addon/);
    expect(titles).not.toMatch(/sharp/);
    expect(titles).toMatch(/@types\/node/);
    expect(checkPackageJson(JSON.stringify({ engines: { node: ">=22" } })).find((x) => x.title.includes("engines"))!.severity).toBe("info");
  });
});

// ─── Cron ────────────────────────────────────────────────────────────────────

describe("Cron dialects", () => {
  const FROM = Date.UTC(2026, 9, 24, 12, 0, 0); // Sat 24 Oct 2026 12:00 UTC
  const runs = (expr: string, dialect: Parameters<typeof parseCron>[1], n = 8, tz = "UTC", from = FROM) => {
    const r = parseCron(expr, dialect);
    expect(r.error, expr).toBeUndefined();
    return nextRuns(r.parsed!, n, tz, from);
  };

  it("Linux: either day-of-month or day-of-week matches when both are set", () => {
    const list = runs("0 0 13 * 5", "standard", 12);
    for (const t of list) {
      const d = new Date(t);
      expect(d.getUTCDate() === 13 || d.getUTCDay() === 5).toBe(true);
    }
    expect(list.some((t) => new Date(t).getUTCDate() === 13 && new Date(t).getUTCDay() !== 5)).toBe(true);
    expect(parseCron("0 0 13 * 5", "standard").warnings[0]).toMatch(/EITHER/);
  });

  it("names, steps from an offset, and @macros", () => {
    expect(runs("0 9 * * MON-FRI", "standard", 5).every((t) => [1, 2, 3, 4, 5].includes(new Date(t).getUTCDay()))).toBe(true);
    expect(runs("20/15 * * * *", "github", 3).map((t) => new Date(t).getUTCMinutes())).toEqual([20, 35, 50]);
    expect(runs("@daily", "standard", 1)[0]).toBe(Date.UTC(2026, 9, 25, 0, 0));
  });

  it("dialect-specific errors", () => {
    expect(parseCron("@daily", "github").error).toMatch(/doesn't support @daily/);
    expect(parseCron("CRON_TZ=UTC 0 3 * * *", "kubernetes").error).toMatch(/spec.timeZone/);
    expect(parseCron("0 9 * * MON-FRI *", "aws").error).toMatch(/"\?"/);
    expect(parseCron("0 9 * * 1", "aws").error).toMatch(/year/);
    expect(parseCron("0 0 9 * * MON", "quartz").error).toMatch(/"\?"/);
    expect(parseCron("0 9 * * *", "spring").error).toMatch(/seconds field/);
    expect(parseCron("0 0 L * *", "standard").error).toMatch(/L/);
    expect(parseCron("cron(0 9 * * ? *)", "standard").error).toMatch(/EventBridge/);
  });

  it("EventBridge: last Friday (6L) and second Tuesday (3#2)", () => {
    for (const t of runs("cron(15 10 ? * 6L *)", "aws", 4)) {
      const d = new Date(t);
      const dim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      expect(d.getUTCDay()).toBe(5);
      expect(d.getUTCDate() + 7).toBeGreaterThan(dim);
    }
    for (const t of runs("cron(0 9 ? * 3#2 *)", "aws", 4)) {
      const d = new Date(t);
      expect(d.getUTCDay()).toBe(2);
      expect(d.getUTCDate()).toBeGreaterThanOrEqual(8);
      expect(d.getUTCDate()).toBeLessThanOrEqual(14);
    }
  });

  it("Quartz seconds, L and W; Spring weekday names", () => {
    expect(minGapMs(runs("0/15 * * * * ?", "quartz", 4))).toBe(15000);
    expect(new Date(runs("0 0 12 L * ?", "quartz", 1)[0]).getUTCDate()).toBe(31);
    // 15 Nov 2026 is a Sunday → nearest weekday is Monday 16th
    expect(new Date(runs("0 0 12 15W * ?", "quartz", 1)[0]).getUTCDate()).toBe(16);
    expect(runs("0 0 9 * * MON-FRI", "spring", 5).every((t) => new Date(t).getUTCDay() >= 1 && new Date(t).getUTCDay() <= 5)).toBe(true);
  });

  it("time zones: DST gaps are skipped and repeated times run once", () => {
    // US clocks jump 02:00 → 03:00 on 8 Mar 2026; 02:30 doesn't exist that day
    const spring = runs("30 2 * * *", "standard", 3, "America/New_York", Date.UTC(2026, 2, 7, 12));
    expect(spring.map((t) => partsIn(t, "America/New_York").day)).toEqual([9, 10, 11]);
    // Clocks go back 02:00 → 01:00 on 1 Nov 2026; 01:30 happens twice but runs once
    const fall = runs("30 1 * * *", "standard", 3, "America/New_York", Date.UTC(2026, 9, 31, 12));
    expect(fall.map((t) => partsIn(t, "America/New_York").day)).toEqual([1, 2, 3]);
    expect(partsIn(runs("0 9 * * *", "standard", 1, "Asia/Yerevan")[0], "Asia/Yerevan").hour).toBe(9);
  });

  it("describes and converts", () => {
    expect(describeCron(parseCron("0 9 * * 1-5", "standard").parsed!)).toBe("At 09:00, on Monday through Friday");
    expect(describeCron(parseCron("*/5 * * * *", "standard").parsed!)).toBe("Every 5 minutes");
    expect(describeCron(parseCron("cron(15 10 ? * 6L *)", "aws").parsed!)).toBe("At 10:15, on the last Friday");
    const p = parseCron("0 9 * * MON-FRI", "standard").parsed!;
    expect(convert(p, "aws").expr).toBe("cron(0 9 ? * 2-6 *)");
    expect(convert(p, "quartz").expr).toBe("0 0 9 ? * 2-6");
    expect(convert(p, "spring").expr).toBe("0 0 9 * * 1-5");
    expect(convert(parseCron("0 0 13 * 5", "standard").parsed!, "aws").note).toMatch(/either-day/);
    expect(convert(parseCron("0 0/15 * * * ?", "quartz").parsed!, "standard").expr).toBe("0/15 * * * *");
  });
});

// ─── Timestamp ───────────────────────────────────────────────────────────────

describe("Timestamp helpers", () => {
  it("detects the unit from the number of digits", () => {
    expect(parseTimestamp("1761300000")).toEqual({ ms: 1761300000000, unit: "s" });
    expect(parseTimestamp("1761300000123")).toEqual({ ms: 1761300000123, unit: "ms" });
    expect(parseTimestamp("1761300000123456")?.unit).toBe("us");
    expect(parseTimestamp("1761300000123456789")?.unit).toBe("ns");
    expect(parseTimestamp("abc")).toBeNull();
  });

  it("relative time picks the right unit (90 s is a minute, not a second)", () => {
    const now = Date.UTC(2026, 9, 24);
    expect(relativeTime(now - 90_000, now)).toBe("2 minutes ago");
    expect(relativeTime(now - 30_000, now)).toBe("30 seconds ago");
    expect(relativeTime(now + 86_400_000, now)).toBe("tomorrow");
    expect(relativeTime(now, now)).toBe("just now");
  });

  it("wall-clock time in a zone → epoch, across DST", () => {
    expect(wallTimeToEpoch("2026-10-24T16:30", "Asia/Yerevan")).toBe(Date.UTC(2026, 9, 24, 12, 30));
    expect(wallTimeToEpoch("2026-07-01T09:00", "America/New_York")).toBe(Date.UTC(2026, 6, 1, 13, 0)); // EDT, UTC-4
    expect(wallTimeToEpoch("2026-12-01T09:00", "America/New_York")).toBe(Date.UTC(2026, 11, 1, 14, 0)); // EST, UTC-5
    expect(wallTimeToEpoch("2026-10-24T12:30:15", "UTC")).toBe(Date.UTC(2026, 9, 24, 12, 30, 15));
    expect(wallTimeToEpoch("nope", "UTC")).toBeNull();
  });

  it("formats and snippets", () => {
    const ms = Date.UTC(2026, 9, 24, 12, 30);
    expect(isoInZone(ms, "UTC")).toBe("2026-10-24T12:30:00Z");
    expect(isoInZone(ms, "Asia/Yerevan")).toBe("2026-10-24T16:30:00+04:00");
    expect(formats(ms, "UTC")[0].value).toBe("2026-10-24T12:30:00.000Z");
    const s = snippets(ms, "Europe/Paris");
    expect(s[0].toDate).toBe(`Temporal.Instant.fromEpochMilliseconds(${ms}).toZonedDateTimeISO("Europe/Paris")`);
    expect(s.find((x) => x.lang === "Go")!.toDate).toBe(`time.Unix(${ms / 1000}, 0).UTC()`);
  });
});

// ─── Ask Ninja detection ─────────────────────────────────────────────────────

describe("Ask Ninja detects inputs for the new tools", () => {
  const first = async (s: string) => (await detectLocal(s))[0];
  it("Google Authenticator export", async () => {
    const d = await first("otpauth-migration://offline?data=CjEKCkhlbGxvId6tvu8SGEV4YW1wbGU6YWxpY2VAZ29vZ2xlLmNvbRoHRXhhbXBsZTAC");
    expect(d.id).toBe("otpauth-migration");
    expect(d.summary).toMatch(/1 account/);
    expect(d.tools[0]).toBe("google-authenticator-export-decoder");
  });
  it("MCP config, JSON Schema, SPF/DMARC records, workflows", async () => {
    expect((await first('{"mcpServers":{"gh":{"command":"npx"}}}')).tools[0]).toBe("mcp-config-generator");
    expect((await first('{"type":"object","properties":{"a":{"type":"string"}}}')).tools[0]).toBe("llm-schema-checker");
    expect((await first("v=spf1 include:_spf.google.com ~all")).tools).toEqual(["email-auth-checker"]);
    expect((await first("v=DMARC1; p=none; rua=mailto:x@example.com")).label).toBe("DMARC record");
    expect((await first("name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4")).tools[0]).toBe("github-actions-generator");
    expect((await first('{"name":"app","dependencies":{"express":"^5.0.0"}}')).tools).toContain("node-26-upgrade-checker");
  });
});

// ─── CSS animation customizer ────────────────────────────────────────────────

describe("CSS animation customizer", () => {
  const CSS = `.spin {
  width: 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;

  it("scales durations and appends overrides to the animated rule only", () => {
    const out = customizeCss(CSS, { ...DEFAULT_ANIMATION_OPTIONS, speed: 2, easing: "ease-in-out", iterations: "3", reducedMotion: false });
    expect(out).toContain("animation: spin 0.5s linear infinite;");
    expect(out).toContain("animation-timing-function: ease-in-out;");
    expect(out).toContain("animation-iteration-count: 3;");
    expect(out.match(/customized/g)).toHaveLength(1);
    expect(out).toContain("0% { transform: rotate(0deg); }");
  });

  it("adds a reduced-motion block for the animated selectors", () => {
    const out = customizeCss(CSS, DEFAULT_ANIMATION_OPTIONS);
    expect(out).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\n {2}\.spin \{/);
    expect(customizeCss(CSS, DEFAULT_ANIMATION_OPTIONS).trimEnd().endsWith("}")).toBe(true);
  });

  it("exports a Tailwind v4 @theme block", () => {
    const tw = toTailwindTheme(CSS)!;
    expect(tw).toContain("--animate-spin: spin 1s linear infinite;");
    expect(tw).toContain("@keyframes spin");
    expect(toTailwindTheme(".a { color: red }")).toBeNull();
  });
});
