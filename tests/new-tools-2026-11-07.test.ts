import { describe, expect, it } from "vitest";
import { crawlSite, isAllowed, normalizeLink, parseRobots, readPage, sameSite, type CrawlResponse } from "@/lib/site-crawl";
import { parsePatch, sideBySide } from "@/lib/patch-parser";
import { classifyHour, decodeMeetingLink, encodeMeetingLink, rankMeetingHours } from "@/lib/meeting-planner";
import { barcodeSvg, generateBarcode, parseGs1 } from "@/lib/barcode";
import { crc32, createZip } from "@/lib/zip-store";
import { buildSql, generateFromSchema } from "@/lib/fake-data";
import { planVpc, vpcCloudFormation, vpcTerraform, type VpcInput } from "@/lib/vpc-subnets";
import { cidrRows, convertMask, listAddresses, rowsToCsv } from "@/lib/cidr-tools";
import { checkCsp, splitPolicies } from "@/lib/csp-check";
import { backoffSchedule, explainRateLimit, mockResponse, parseResetValue, parseRetryAfter, readMockParams } from "@/lib/retry-after";
import { inspectRequest } from "@/lib/request-headers";

describe("site crawl", () => {
  it("applies robots.txt with the longest match, and Allow winning a tie", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /private\nAllow: /private/open\nDisallow: /*.pdf$\n");
    expect(isAllowed(rules, "/private/x")).toBe(false);
    expect(isAllowed(rules, "/private/open/page")).toBe(true);
    expect(isAllowed(rules, "/file.pdf")).toBe(false);
    expect(isAllowed(rules, "/about")).toBe(true);
  });

  it("treats www as the same site and drops tracking params and fragments", () => {
    expect(sameSite("www.example.com", "example.com")).toBe(true);
    expect(sameSite("blog.example.com", "example.com")).toBe(false);
    const link = normalizeLink("/a?utm_source=x&id=1#top", "https://example.com/", "example.com");
    expect(link).toBe("https://example.com/a?id=1");
    expect(normalizeLink("/photo.jpg", "https://example.com/", "example.com")).toBeNull();
    expect(normalizeLink("https://other.com/a", "https://example.com/", "example.com")).toBeNull();
    expect(normalizeLink("mailto:a@example.com", "https://example.com/", "example.com")).toBeNull();
  });

  it("reads a page's title, links, canonical and robots directives", () => {
    const page = readPage(`<html><head><title>Hi &amp; bye</title><link rel="canonical" href="https://example.com/c"><meta name="robots" content="noindex"></head><body><a href="/one">1</a><a href="https://other.com/">x</a></body></html>`, "https://example.com/", "example.com");
    expect(page.title).toContain("Hi");
    expect(page.canonical).toBe("https://example.com/c");
    expect(page.noindex).toBe(true);
    expect(page.links).toContain("https://example.com/one");
    expect(page.links).not.toContain("https://other.com/");
  });

  it("crawls a small site within its limit, once per page", async () => {
    const site: Record<string, string[]> = {
      "https://example.com/": ["https://example.com/a", "https://example.com/b"],
      "https://example.com/a": ["https://example.com/", "https://example.com/c"],
      "https://example.com/b": [],
      "https://example.com/c": [],
    };
    const calls: string[] = [];
    const fetchPage = async (url: string): Promise<CrawlResponse> => {
      calls.push(url);
      return { ok: true, url, finalUrl: url, status: 200, canonical: null, noindex: url.endsWith("/b"), links: site[url] ?? [], lastModified: null, crawlDelay: null };
    };
    const all = await crawlSite("https://example.com/", { fetchPage, maxPages: 10, delayMs: 0, sleep: async () => {} });
    // A noindex page doesn't belong in a sitemap, so it's reported instead
    expect(all.pages.map((p) => p.url).sort()).toEqual(Object.keys(site).filter((u) => !u.endsWith("/b")).sort());
    expect(all.noindex).toEqual(["https://example.com/b"]);
    expect(new Set(calls).size).toBe(calls.length);
    const limited = await crawlSite("https://example.com/", { fetchPage, maxPages: 2, delayMs: 0, sleep: async () => {} });
    expect(limited.pages.length).toBe(2);
  });
});

describe("patch parser", () => {
  const patch = `From 3f2a1c9d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 Mon Sep 17 00:00:00 2001
From: Ada <ada@example.com>
Subject: [PATCH] Change

diff --git a/a.txt b/a.txt
--- a/a.txt
+++ b/a.txt
@@ -1,3 +1,3 @@
 one
-two
+TWO
 three
diff --git a/new.txt b/new.txt
new file mode 100644
--- /dev/null
+++ b/new.txt
@@ -0,0 +1 @@
+hello
diff --git a/old.txt b/moved.txt
similarity index 100%
rename from old.txt
rename to moved.txt
diff --git a/logo.png b/logo.png
Binary files a/logo.png and b/logo.png differ
`;

  it("finds each file's status, counts and commit", () => {
    const p = parsePatch(patch);
    expect(p.files.map((f) => f.status)).toEqual(["modified", "added", "renamed", "binary"]);
    expect(p.additions).toBe(2);
    expect(p.deletions).toBe(1);
    expect(p.commits[0].subject).toContain("Change");
    expect(p.files[0].hunks[0].lines.find((l) => l.type === "insert")?.newNo).toBe(2);
  });

  it("pairs deletes with inserts for the side-by-side view", () => {
    const rows = sideBySide(parsePatch(patch).files[0].hunks[0]);
    const changed = rows.find((r) => r.left?.type === "delete");
    expect(changed?.left?.text).toBe("two");
    expect(changed?.right?.text).toBe("TWO");
  });

  it("finds nothing in text that isn't a patch", () => {
    expect(parsePatch("just some words").files).toEqual([]);
  });
});

describe("meeting planner", () => {
  it("honors custom and overnight working hours", () => {
    expect(classifyHour(10)).toBe("work");
    expect(classifyHour(3)).not.toBe("work");
    expect(classifyHour(23, { start: 22, end: 6 })).toBe("work");
    expect(classifyHour(2, { start: 22, end: 6 })).toBe("work");
    expect(classifyHour(12, { start: 22, end: 6 })).not.toBe("work");
  });

  it("ranks the hours that suit the most people first", () => {
    const ranked = rankMeetingHours([
      { hours: { start: 9, end: 18 }, localHourAt: (h: number) => h },
      { hours: { start: 9, end: 18 }, localHourAt: (h: number) => (h + 5) % 24 },
    ]);
    expect(ranked[0].work).toBe(2);
    const best = ranked[0].refHour;
    expect(best + 5).toBeGreaterThanOrEqual(9);
    expect(best).toBeGreaterThanOrEqual(9);
  });

  it("round-trips a share link and refuses unknown data", () => {
    const link = { ref: "America/New_York", date: "2026-11-09", cities: ["Europe/London", "Asia/Tokyo"], hour: 10, hours: { "Asia/Tokyo": { start: 22, end: 6 } } };
    expect(decodeMeetingLink(encodeMeetingLink(link))).toEqual(link);
    expect(decodeMeetingLink("%%%not-a-link")).toEqual({});
    expect(decodeMeetingLink("ref=Mars/Olympus&cities=Nowhere/Land,Asia/Tokyo&hour=99&date=soon&hours=Asia/Tokyo:5-5")).toEqual({ cities: ["Asia/Tokyo"] });
    // Default hours aren't worth writing into the link
    expect(encodeMeetingLink({ hours: { "Asia/Tokyo": { start: 9, end: 18 } } })).toBe("");
  });
});

describe("GS1-128, SVG and ZIP", () => {
  it("validates Application Identifiers", () => {
    expect(parseGs1("(01)09501101530003(10)ABC")).toHaveLength(2);
    expect(() => parseGs1("01095")).toThrow(/brackets/);
    expect(() => parseGs1("(01)09501101530004")).toThrow(/check digit/);
    expect(() => parseGs1("(17)2612")).toThrow(/6 digits/);
    expect(() => parseGs1("(10)ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toThrow(/at most/);
  });

  it("encodes as Code 128 with a start code and stop pattern", () => {
    const r = generateBarcode("gs1128", "(01)09501101530003(10)ABC");
    expect(r.displayText).toBe("(01)09501101530003(10)ABC");
    expect(r.modules.endsWith("1100011101011")).toBe(true);
  });

  it("escapes barcode text in SVG, since Code 128 can encode markup", () => {
    const svg = barcodeSvg(generateBarcode("code128", `<script>&"x`));
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("writes a valid stored ZIP", () => {
    const data = new TextEncoder().encode("hello");
    expect(crc32(data)).toBe(0x3610a686);
    const zip = createZip([{ name: "a.txt", data }, { name: "b.txt", data }]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = zip.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const centralStart = view.getUint32(end + 16, true);
    expect(view.getUint32(centralStart, true)).toBe(0x02014b50);
  });
});

describe("fake data from a JSON Schema", () => {
  const schema = JSON.stringify({
    type: "object",
    required: ["id", "plan", "age", "email", "tags", "address"],
    properties: {
      id: { type: "string", format: "uuid" },
      plan: { enum: ["free", "pro"] },
      age: { type: "integer", minimum: 18, maximum: 30 },
      email: { type: "string", format: "email" },
      tags: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
      address: { $ref: "#/$defs/address" },
      kind: { const: "user" },
    },
    $defs: { address: { type: "object", required: ["city"], properties: { city: { type: "string" } } } },
  });

  it("follows the schema's constraints", () => {
    const { rows } = generateFromSchema(schema, 200, "seed");
    for (const r of rows as Record<string, never>[]) {
      expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(["free", "pro"]).toContain(r.plan);
      expect(r.age).toBeGreaterThanOrEqual(18);
      expect(r.age).toBeLessThanOrEqual(30);
      expect(Number.isInteger(r.age)).toBe(true);
      expect(r.email).toContain("@");
      expect(r.tags).toHaveLength(2);
      expect(typeof (r.address as { city: string }).city).toBe("string");
      if ("kind" in r) expect(r.kind).toBe("user");
    }
  });

  it("is reproducible with a seed", () => {
    expect(generateFromSchema(schema, 5, "s").rows).toEqual(generateFromSchema(schema, 5, "s").rows);
    expect(generateFromSchema(schema, 5, "s").rows).not.toEqual(generateFromSchema(schema, 5, "t").rows);
  });

  it("handles number edge cases and multipleOf", () => {
    const { rows } = generateFromSchema(JSON.stringify({ type: "object", required: ["n", "m", "x"], properties: { n: { type: "integer", multipleOf: 5, minimum: 7, maximum: 21 }, m: { type: "number", exclusiveMinimum: 0, exclusiveMaximum: 1 }, x: { type: "integer", maximum: -5 } } }), 100, "n");
    for (const r of rows as { n: number; m: number; x: number }[]) {
      expect([10, 15, 20]).toContain(r.n);
      expect(r.m).toBeGreaterThan(0);
      expect(r.m).toBeLessThan(1);
      expect(r.x).toBeLessThanOrEqual(-5);
    }
  });

  it("stops on a schema that refers to itself", () => {
    const tree = JSON.stringify({ $ref: "#/$defs/node", $defs: { node: { type: "object", required: ["v", "kids"], properties: { v: { type: "integer" }, kids: { type: "array", items: { $ref: "#/$defs/node" } } } } } });
    expect(generateFromSchema(tree, 3, "t").rows).toHaveLength(3);
  });

  it("reports bad input and unsupported keywords", () => {
    expect(() => generateFromSchema("{not json", 1)).toThrow();
    expect(() => generateFromSchema("[]", 1)).toThrow(/object/);
    expect(() => generateFromSchema(JSON.stringify({ $ref: "#/nope" }), 1)).toThrow(/no #\/nope/);
    expect(() => generateFromSchema(JSON.stringify({ $ref: "https://x/y" }), 1)).toThrow(/inside the schema/);
    expect(generateFromSchema(JSON.stringify({ type: "string", pattern: "^a$" }), 1).unsupported).toEqual(["pattern"]);
  });
});

describe("fake data SQL", () => {
  const rows = [
    { id: "3f2b1c9d-8e7b-4a5f-9e3d-2c1b0a9f8e7d", name: "O'Brien \\ Co", active: true, score: 1.5, n: 3, at: "2026-01-02T03:04:05.000Z", day: "2026-01-02", meta: { a: 1 }, none: null },
    { id: "4a2b1c9d-8e7b-4a5f-9e3d-2c1b0a9f8e7d", name: "Ada", active: false, score: 2, n: 4, at: "2026-01-03T03:04:05.000Z", day: "2026-01-03", meta: { a: 2 }, none: null },
  ];

  it("writes PostgreSQL", () => {
    const sql = buildSql(rows, "users", "postgres", { createTable: true });
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('"id" UUID');
    expect(sql).toContain('"active" BOOLEAN');
    expect(sql).toContain('"at" TIMESTAMPTZ');
    expect(sql).toContain('"day" DATE');
    expect(sql).toContain('"meta" JSONB');
    expect(sql).toContain("TRUE");
    expect(sql).toContain("'O''Brien \\ Co'");
  });

  it("writes MySQL with its own quoting, booleans, dates and backslashes", () => {
    const sql = buildSql(rows, "users", "mysql", { createTable: true });
    expect(sql).toContain("CREATE TABLE `users`");
    expect(sql).toContain("`active` TINYINT(1)");
    expect(sql).toContain("`at` DATETIME");
    expect(sql).toContain("'2026-01-02 03:04:05'");
    expect(sql).toContain("'O''Brien \\\\ Co'");
    expect(sql).not.toContain("TRUE");
  });

  it("writes SQLite", () => {
    const sql = buildSql(rows, "users", "sqlite", { createTable: true });
    expect(sql).toContain('"active" INTEGER');
    expect(sql).toContain('"at" TEXT');
    expect(sql).toContain("'2026-01-02T03:04:05.000Z'");
  });

  it("quotes hostile identifiers and batches rows", () => {
    expect(buildSql([{ 'a"b': 1 }], 'x"; DROP TABLE y; --', "postgres")).toContain('INSERT INTO "x""; DROP TABLE y; --" ("a""b")');
    const many = Array.from({ length: 5 }, (_, i) => ({ i }));
    expect(buildSql(many, "t", "sqlite", { batch: 2 }).match(/INSERT INTO/g)).toHaveLength(3);
  });

  it("quotes every value in a column of mixed types", () => {
    const sql = buildSql([{ v: 1 }, { v: "x" }], "t", "postgres", { createTable: true });
    expect(sql).toContain('"v" TEXT');
    expect(sql).toContain("('1')");
  });

  it("returns nothing when rows have no columns", () => {
    expect(buildSql(["a", 1], "t", "postgres")).toBe("");
  });
});

describe("AWS VPC subnets", () => {
  const input: VpcInput = {
    name: "My Prod!",
    cidr: "10.0.0.0/16",
    azCount: 3,
    spareAzs: 0,
    nat: "none",
    tiers: [
      { name: "public", type: "public", prefix: 24 },
      { name: "private", type: "private", prefix: 20 },
      { name: "database", type: "database", prefix: 24 },
    ],
  };

  it("allocates aligned, non-overlapping subnets with AWS's reservations", () => {
    const plan = planVpc(input);
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.subnets).toHaveLength(9);
    expect(plan.subnets[0].cidr).toBe("10.0.0.0/20");
    expect(plan.subnets[0].firstUsable).toBe("10.0.0.4");
    expect(plan.subnets[0].lastUsable).toBe("10.0.15.254");
    expect(plan.subnets[0].usable).toBe(4091);
    const pub = plan.subnets.find((s) => s.tier === "public")!;
    expect(pub.usable).toBe(251);
    const spans = plan.subnets.map((s) => {
      const [ip, p] = s.cidr.split("/");
      const start = ip.split(".").reduce((n, o) => n * 256 + Number(o), 0);
      expect(start % 2 ** (32 - Number(p))).toBe(0);
      return [start, start + 2 ** (32 - Number(p)) - 1];
    });
    for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThan(spans[i - 1][1]);
    expect(plan.used + plan.free.reduce((n, c) => n + 2 ** (32 - Number(c.split("/")[1])), 0)).toBe(plan.total);
  });

  it("keeps room for future zones", () => {
    const plan = planVpc({ ...input, spareAzs: 1 });
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.subnets.filter((s) => s.tier === "private").map((s) => s.cidr)).toEqual(["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20"]);
    expect(plan.subnets.find((s) => s.tier === "public")!.cidr).toBe("10.0.64.0/24");
  });

  it("refuses what AWS refuses", () => {
    expect(planVpc({ ...input, cidr: "10.0.0.0/8" })).toMatchObject({ ok: false });
    expect(planVpc({ ...input, cidr: "nope" })).toMatchObject({ ok: false });
    expect(planVpc({ ...input, cidr: "10.0.0.0/24" })).toMatchObject({ ok: false });
    expect(planVpc({ ...input, tiers: [{ name: "a", type: "public", prefix: 29 }] })).toMatchObject({ ok: false });
    expect(planVpc({ ...input, tiers: [{ name: "a", type: "public", prefix: 24 }, { name: "A", type: "private", prefix: 24 }] })).toMatchObject({ ok: false });
    expect(planVpc({ ...input, tiers: [] })).toMatchObject({ ok: false });
  });

  it("warns about risky ranges and layouts", () => {
    const docker = planVpc({ ...input, cidr: "172.17.0.0/16" });
    expect(docker.ok && docker.warnings.join()).toContain("172.17.0.0/16");
    const pub = planVpc({ ...input, cidr: "8.8.0.0/16" });
    expect(pub.ok && pub.warnings.join()).toContain("private range");
    const one = planVpc({ ...input, azCount: 1 });
    expect(one.ok && one.warnings.join()).toContain("database subnet group");
    const noPublic = planVpc({ ...input, nat: "single", tiers: [{ name: "private", type: "private", prefix: 24 }] });
    expect(noPublic.ok && noPublic.warnings.join()).toContain("NAT gateway has to sit");
  });

  it("writes Terraform that references resources it defines", () => {
    const plan = planVpc({ ...input, nat: "per-az" });
    if (!plan.ok) throw new Error(plan.error);
    const tf = vpcTerraform(plan);
    expect(tf).toContain('cidr_block           = "10.0.0.0/16"');
    expect(tf).toContain('Name = "my-prod"');
    expect(tf).toContain('resource "aws_nat_gateway" "c"');
    expect(tf).toContain('resource "aws_db_subnet_group" "database"');
    expect(tf).toContain("data.aws_availability_zones.available.names[2]");
    const defined = new Set(Array.from(tf.matchAll(/resource "(\w+)" "(\w+)"/g)).map((m) => `${m[1]}.${m[2]}`));
    for (const ref of Array.from(tf.matchAll(/\b(aws_[a-z_]+)\.(\w+)\.id/g))) expect(defined.has(`${ref[1]}.${ref[2]}`)).toBe(true);
    expect((tf.match(/\{/g) ?? []).length).toBe((tf.match(/\}/g) ?? []).length);
  });

  it("gives tiers starting with a digit valid Terraform names", () => {
    const plan = planVpc({ ...input, tiers: [{ name: "2nd-tier", type: "public", prefix: 24 }] });
    if (!plan.ok) throw new Error(plan.error);
    const names = Array.from(vpcTerraform(plan).matchAll(/resource "\w+" "(\w+)"/g)).map((m) => m[1]);
    for (const n of names) expect(n).toMatch(/^[A-Za-z_]/);
  });

  it("writes CloudFormation that references resources it defines", () => {
    for (const nat of ["none", "single", "per-az"] as const) {
      const plan = planVpc({ ...input, nat });
      if (!plan.ok) throw new Error(plan.error);
      const cf = vpcCloudFormation(plan);
      expect(cf).toContain("AWSTemplateFormatVersion");
      const logical = new Set(Array.from(cf.matchAll(/^ {2}(\w+):$/gm)).map((m) => m[1]));
      for (const ref of Array.from(cf.matchAll(/!Ref (\w+)/g))) expect(logical.has(ref[1])).toBe(true);
      expect(/[^A-Za-z0-9]/.test(Array.from(logical).join(""))).toBe(false);
    }
  });

  it("uses one NAT gateway for every private subnet when asked", () => {
    const plan = planVpc({ ...input, nat: "single" });
    if (!plan.ok) throw new Error(plan.error);
    const tf = vpcTerraform(plan);
    expect(tf.match(/resource "aws_nat_gateway"/g)).toHaveLength(1);
    expect(tf.match(/aws_route_table\.private_a\.id/g)).toHaveLength(3);
  });
});

describe("CIDR to IP range", () => {
  it("converts each line, in order", () => {
    const { rows, errors } = cidrRows("10.0.0.0/24\n192.168.1.0/29 # office\n# comment\n10.0.0.5/32\nnope\n10.1.0.0 255.255.255.0\n192.0.2.1-192.0.2.3");
    expect(errors).toHaveLength(1);
    expect(rows.map((r) => r.first)).toEqual(["10.0.0.0", "192.168.1.0", "10.0.0.5", "10.1.0.0", "192.0.2.1"]);
    expect(rows[0]).toMatchObject({ last: "10.0.0.255", total: 256, hosts: 254, firstHost: "10.0.0.1", lastHost: "10.0.0.254", mask: "255.255.255.0", wildcard: "0.0.0.255" });
    expect(rows[2]).toMatchObject({ total: 1, hosts: 1, mask: "255.255.255.255" });
    expect(rows[3].cidr).toBe("10.1.0.0/24");
    expect(rows[4]).toMatchObject({ cidr: null, cidrs: ["192.0.2.1/32", "192.0.2.2/31"], mask: null, total: 3 });
  });

  it("handles the extremes", () => {
    const { rows } = cidrRows("0.0.0.0/0\n10.0.0.0/31");
    expect(rows[0]).toMatchObject({ first: "0.0.0.0", last: "255.255.255.255", total: 4294967296, mask: "0.0.0.0" });
    expect(rows[1]).toMatchObject({ hosts: 2, firstHost: "10.0.0.0", lastHost: "10.0.0.1" });
  });

  it("exports CSV and caps the address list", () => {
    const { rows } = cidrRows("10.0.0.0/30");
    expect(rowsToCsv(rows).split("\n")[1]).toBe("10.0.0.0/30,10.0.0.0/30,10.0.0.0,10.0.0.3,10.0.0.1,10.0.0.2,4,2,255.255.255.252,0.0.0.3");
    expect(listAddresses(rows, 100)).toEqual({ addresses: ["10.0.0.0", "10.0.0.1", "10.0.0.2", "10.0.0.3"], truncated: false });
    expect(listAddresses(rows, 2)).toEqual({ addresses: ["10.0.0.0", "10.0.0.1"], truncated: true });
  });

  it("converts masks in every direction", () => {
    expect(convertMask("/24")).toMatchObject({ prefix: 24, mask: "255.255.255.0", wildcard: "0.0.0.255", total: 256, hosts: 254 });
    expect(convertMask("255.255.255.192")).toMatchObject({ prefix: 26, hosts: 62 });
    expect(convertMask("0.0.0.255")).toMatchObject({ prefix: 24 });
    expect(convertMask("32")).toMatchObject({ prefix: 32, hosts: 1 });
    expect(convertMask("255.0.255.0")).toHaveProperty("error");
    expect(convertMask("33")).toHaveProperty("error");
  });
});

describe("CSP checker", () => {
  const titles = (policy: string, opts = {}) => checkCsp(policy, opts).findings.map((f) => `${f.severity}: ${f.title}`).join("\n");
  const STRONG = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'; report-to csp";

  it("gives a strong policy an A", () => {
    const r = checkCsp(STRONG);
    expect(r.grade).toBe("A");
    expect(r.findings.filter((f) => f.severity !== "info")).toEqual([]);
    expect(r.passes.length).toBeGreaterThan(3);
  });

  it("flags inline scripts unless a nonce or hash makes them ignored", () => {
    expect(titles("script-src 'self' 'unsafe-inline'")).toContain("high: 'unsafe-inline' allows inline scripts");
    const nonce = "abcdefghijklmnopqrstuvwx";
    const withNonce = titles(`script-src 'nonce-${nonce}' 'unsafe-inline'`);
    expect(withNonce).toContain("info: 'unsafe-inline' is ignored here");
    expect(withNonce).not.toContain("high: 'unsafe-inline'");
  });

  it("flags over-broad script sources, through default-src too", () => {
    expect(titles("script-src *")).toContain("high: * allows");
    expect(titles("script-src https:")).toContain("high: https:");
    expect(titles("script-src data:")).toContain("high: data:");
    expect(titles("script-src http://cdn.example.com")).toContain("plain HTTP");
    expect(titles("default-src *")).toContain("falls back to default-src");
    expect(titles("script-src https://cdn.jsdelivr.net")).toContain("medium: cdn.jsdelivr.net");
    expect(titles("script-src *.example.com")).toContain("low: *.example.com");
  });

  it("ignores hosts under strict-dynamic, as browsers do", () => {
    const nonce = "abcdefghijklmnopqrstuvwx";
    const out = titles(`script-src 'nonce-${nonce}' 'strict-dynamic' https: *`);
    expect(out).not.toContain("high: https:");
    expect(out).not.toContain("high: * allows");
    expect(titles("script-src 'strict-dynamic'")).toContain("nothing to start from");
  });

  it("flags the directives without a fallback", () => {
    const out = titles("default-src 'self'");
    expect(out).toContain("medium: No base-uri");
    expect(out).toContain("medium: No frame-ancestors");
    expect(out).toContain("low: No form-action");
    expect(titles("default-src 'self'", { hasFrameOptions: true })).toContain("low: No frame-ancestors");
  });

  it("catches common typing mistakes", () => {
    expect(titles("script-src self")).toContain("self needs single quotes");
    expect(titles("script-src nonce-abc")).toContain("nonce or hash needs single quotes");
    expect(titles("script-src 'nonce-abc'")).toContain("too short");
    expect(titles("object-src 'none' 'self'")).toContain("'none' is ignored");
    expect(titles("script-src 'self'; script-src *")).toContain("script-src appears twice");
    expect(titles("scrpt-src 'self'")).toContain("Unknown directive: scrpt-src");
    expect(titles("block-all-mixed-content")).toContain("obsolete");
  });

  it("reads directives and keywords case-insensitively", () => {
    expect(titles("SCRIPT-SRC 'SELF' 'UNSAFE-INLINE'")).toContain("high: 'unsafe-inline'");
  });

  it("scores report-only and empty policies low", () => {
    expect(titles(STRONG, { reportOnly: true })).toContain("Report-only");
    expect(checkCsp(STRONG, { reportOnly: true }).score).toBeLessThan(checkCsp(STRONG).score);
    expect(checkCsp("   ")).toMatchObject({ score: 0, grade: "F" });
  });

  it("drops a pasted header name and splits multiple policies", () => {
    expect(checkCsp("Content-Security-Policy: default-src 'self'").directives[0].name).toBe("default-src");
    expect(splitPolicies("default-src 'self', script-src 'none'")).toEqual(["default-src 'self'", "script-src 'none'"]);
  });

  it("never scores below zero", () => {
    const r = checkCsp("script-src * 'unsafe-inline' 'unsafe-eval' https: http: data: blob:");
    expect(r.score).toBe(0);
    expect(r.grade).toBe("F");
  });
});

describe("Retry-After", () => {
  const NOW = Date.UTC(2026, 10, 7, 12, 0, 0);

  it("parses both legal forms and rejects the rest", () => {
    expect(parseRetryAfter("120", NOW)).toMatchObject({ kind: "seconds", seconds: 120 });
    expect(parseRetryAfter("Sat, 07 Nov 2026 12:01:00 GMT", NOW)).toMatchObject({ kind: "date", seconds: 60 });
    expect(parseRetryAfter("Sat, 07 Nov 2026 11:00:00 GMT", NOW)).toMatchObject({ kind: "date", seconds: 0 });
    expect(parseRetryAfter("1.5", NOW).kind).toBe("invalid");
    expect(parseRetryAfter("-1", NOW).kind).toBe("invalid");
    expect(parseRetryAfter("soon", NOW).kind).toBe("invalid");
  });

  it("reads reset values in every provider's form", () => {
    expect(parseResetValue("30", NOW)).toMatchObject({ seconds: 30 });
    expect(parseResetValue("1s", NOW)?.seconds).toBe(1);
    expect(parseResetValue("6m0s", NOW)?.seconds).toBe(360);
    expect(parseResetValue("1h2m3s", NOW)?.seconds).toBe(3723);
    expect(parseResetValue("250ms", NOW)?.seconds).toBe(0.25);
    expect(parseResetValue(String(NOW / 1000 + 45), NOW)).toMatchObject({ seconds: 45, form: "a Unix time in seconds" });
    expect(parseResetValue(String(NOW + 5000), NOW)).toMatchObject({ seconds: 5, form: "a Unix time in milliseconds" });
    expect(parseResetValue("2026-11-07T12:00:10Z", NOW)?.seconds).toBe(10);
    expect(parseResetValue("whenever", NOW)).toBeNull();
  });

  it("puts Retry-After ahead of the counters", () => {
    const r = explainRateLimit("HTTP/2 429\nretry-after: 30\nx-ratelimit-limit: 60\nx-ratelimit-remaining: 0\nx-ratelimit-reset: 999", NOW);
    expect(r.status).toBe(429);
    expect(r.wait?.seconds).toBe(30);
    expect(r.limit).toBe(60);
    expect(r.remaining).toBe(0);
    expect(r.headers).toHaveLength(4);
  });

  it("falls back to reset, then to backoff advice", () => {
    expect(explainRateLimit("HTTP/1.1 429 Too Many Requests\nX-RateLimit-Reset: 20", NOW).wait?.seconds).toBe(20);
    expect(explainRateLimit("x-ratelimit-remaining: 0\nx-ratelimit-reset: 20", NOW).wait?.seconds).toBe(20);
    expect(explainRateLimit("HTTP/2 429", NOW).verdict).toContain("backoff");
    expect(explainRateLimit("HTTP/2 200\nx-ratelimit-remaining: 5\nx-ratelimit-reset: 20", NOW).wait).toBeNull();
    expect(explainRateLimit("content-type: text/html", NOW).verdict).toBe("No rate limit headers found.");
  });

  it("reads provider formats", () => {
    const openai = explainRateLimit("x-ratelimit-limit-requests: 60\nx-ratelimit-remaining-requests: 0\nx-ratelimit-reset-requests: 1s\nx-ratelimit-reset-tokens: 6m0s", NOW);
    expect(openai.limit).toBe(60);
    expect(openai.wait?.seconds).toBe(360);
    const anthropic = explainRateLimit("HTTP/2 429\nanthropic-ratelimit-requests-remaining: 0\nanthropic-ratelimit-requests-reset: 2026-11-07T12:00:30Z", NOW);
    expect(anthropic.wait?.seconds).toBe(30);
    const draft = explainRateLimit('RateLimit: "default";r=0;t=12', NOW);
    expect(draft.remaining).toBe(0);
    expect(draft.wait?.seconds).toBe(12);
    const old = explainRateLimit("RateLimit: limit=100, remaining=50, reset=30", NOW);
    expect(old.limit).toBe(100);
    expect(old.remaining).toBe(50);
    expect(explainRateLimit("retry-after-ms: 1500", NOW).wait?.seconds).toBe(1.5);
    expect(explainRateLimit("Retry-After: soon", NOW).headers[0].bad).toBe(true);
  });

  it("computes the backoff schedule", () => {
    const opts = { baseSeconds: 1, factor: 2, capSeconds: 5, attempts: 4 };
    expect(backoffSchedule({ ...opts, jitter: "none" }).map((s) => s.maxSeconds)).toEqual([1, 2, 4, 5]);
    expect(backoffSchedule({ ...opts, jitter: "none" })[2].minSeconds).toBe(4);
    expect(backoffSchedule({ ...opts, jitter: "full" })[2].minSeconds).toBe(0);
    expect(backoffSchedule({ ...opts, jitter: "equal" })[2].minSeconds).toBe(2);
  });

  it("clamps test endpoint settings", () => {
    expect(readMockParams(new URLSearchParams(""))).toEqual({ limit: 3, windowSeconds: 30, status: 429, format: "seconds" });
    expect(readMockParams(new URLSearchParams("limit=9999&window=99999&status=503&format=date"))).toEqual({ limit: 100, windowSeconds: 3600, status: 503, format: "date" });
    expect(readMockParams(new URLSearchParams("limit=-5&window=0&status=200"))).toMatchObject({ limit: 0, windowSeconds: 1, status: 429 });
    expect(readMockParams(new URLSearchParams("limit=abc"))).toMatchObject({ limit: 3 });
  });

  it("allows up to the limit, then refuses with a correct Retry-After", () => {
    const p = readMockParams(new URLSearchParams("limit=2&window=30"));
    const start = NOW;
    expect(mockResponse(p, 2, start, start + 1000)).toMatchObject({ status: 200, allowed: true, remaining: 0 });
    const refused = mockResponse(p, 3, start, start + 10_500);
    expect(refused).toMatchObject({ status: 429, allowed: false });
    expect(refused.headers["Retry-After"]).toBe("20");
    expect(refused.headers["X-RateLimit-Reset"]).toBe(String(start / 1000 + 30));
    const date = mockResponse({ ...p, format: "date" }, 3, start, start);
    expect(parseRetryAfter(date.headers["Retry-After"], start)).toMatchObject({ kind: "date", seconds: 30 });
    expect(mockResponse({ ...p, status: 503 }, 3, start, start).status).toBe(503);
  });

  it("only sends Retry-After when refusing", () => {
    expect(mockResponse(readMockParams(new URLSearchParams("limit=5")), 1, NOW, NOW).headers["Retry-After"]).toBeUndefined();
  });
});

describe("request headers", () => {
  const seen = inspectRequest([
    ["User-Agent", "curl/8"],
    ["Cookie", "session=secret"],
    ["Authorization", "Bearer secret"],
    ["x-api-key", "secret"],
    ["x-vercel-oidc-token", "secret"],
    ["x-vercel-proxy-signature", "secret"],
    ["x-middleware-subrequest", "secret"],
    ["Via", "1.1 proxy"],
    ["CF-Connecting-IP", "203.0.113.1"],
    ["X-Forwarded-For", "203.0.113.1"],
    ["X-Test", "hello"],
  ]);

  it("never returns secrets or the host's internal headers", () => {
    const json = JSON.stringify(seen.headers.concat(seen.proxySignals, seen.forwarding));
    expect(json).not.toContain("secret");
    expect(seen.withheld.sort()).toEqual(["authorization", "cookie", "x-api-key"]);
  });

  it("sorts headers into the right groups", () => {
    expect(seen.proxySignals.map((h) => h.name)).toEqual(["cf-connecting-ip", "via"]);
    expect(seen.forwarding.map((h) => h.name)).toEqual(["x-forwarded-for"]);
    expect(seen.headers.map((h) => h.name)).toEqual(["user-agent", "x-test"]);
    expect(seen.headers[0].note).toBeTruthy();
  });
});
