import { describe, expect, it } from "vitest";
import { LLM_MODELS, PRICING_SOURCES, ratesOn, workloadCost, type Workload } from "@/lib/llm-pricing";
import { modelPricing } from "@/lib/token-counter";
import { TOKEN_COUNTER_PAGES } from "@/lib/token-counter-pages";
import { GATEWAYS, formatCardNumber } from "@/lib/payment-test-cards";
import { luhnIsValid } from "@/lib/card-test-numbers";
import { formatPath, getAt, searchJson } from "@/lib/json-paths";
import { mergeRanges, parseEntry, parseList, planVlsm, rangeToCidrs, rangesToCidrs, subtractRanges } from "@/lib/cidr-tools";
import { ipToNum } from "@/lib/cidr-info";
import { parseCurl } from "@/lib/curl-parser";
import { LANGUAGES, toCSharp, toJava, toPhpCurl, toPowerShell, toRuby, toWget } from "@/lib/curl-generators";
import { CURL_LANGUAGE_PAGES } from "@/lib/curl-languages";
import { FLAVORS, checkFlavor, regexSnippet, toJavaScript } from "@/lib/regex-flavors";
import { FLAVOR_PAGES } from "@/lib/regex-flavor-pages";
import { encodeCode39, encodeEAN8, encodeITF14, generateBarcode, gs1CheckDigit } from "@/lib/barcode";
import { BARCODE_PAGES } from "@/lib/barcode-pages";
import { fetchHeaders, isPublicAddress, resolvePublic } from "@/lib/safe-fetch";
import { tools } from "@/lib/tools";
import { toolContent } from "@/lib/tool-content";
import { customToolMeta } from "@/lib/metadata";

const NEW_TOOLS = ["llm-api-cost-calculator", "payment-test-cards", "json-path-finder", "cidr-merge", "vlsm-subnet-planner"];

describe("registry", () => {
  it("every new tool has a registry entry, title and page content", () => {
    for (const slug of NEW_TOOLS) {
      expect(tools.some((t) => t.slug === slug), slug).toBe(true);
      expect(customToolMeta(slug)?.title, slug).toMatch(/\| ToolNinja$/);
      expect(toolContent[slug]?.faq?.length, slug).toBeGreaterThan(1);
    }
  });
});

describe("LLM pricing", () => {
  const base: Workload = { requests: 1000, inputTokens: 10_000, outputTokens: 1_000, cachedTokens: 0, cacheHitRate: 0, batchShare: 0 };
  const model = (id: string) => LLM_MODELS.find((m) => m.id === id)!;

  it("prices a plain workload from the list price", () => {
    // Opus 5.5: $4 in / $20 out per 1M → 10K in = $0.04, 1K out = $0.02
    const c = workloadCost(model("claude-opus-5-5"), base, "2026-10-31");
    expect(c.perRequest).toBeCloseTo(0.06, 10);
    expect(c.perMonth).toBeCloseTo(60, 6);
    expect(c.perMonthNoCache).toBeCloseTo(60, 6);
  });

  it("charges cache hits, cache writes and the batch discount", () => {
    const w = { ...base, cachedTokens: 8_000, cacheHitRate: 1 };
    const hit = workloadCost(model("claude-opus-5-5"), w, "2026-10-31");
    // 2K fresh × $4 + 8K × $0.20 read + 1K × $20
    expect(hit.perRequest).toBeCloseTo(0.008 + 0.0016 + 0.02, 10);
    const miss = workloadCost(model("claude-opus-5-5"), { ...w, cacheHitRate: 0 }, "2026-10-31");
    expect(miss.cacheWrite).toBeCloseTo(0.04, 10); // 8K × $5 write
    const batch = workloadCost(model("claude-opus-5-5"), { ...base, batchShare: 1 }, "2026-10-31");
    expect(batch.perRequest).toBeCloseTo(0.03, 10);
    // Gemini has no write premium: a miss costs the input price
    const g = workloadCost(model("gemini-3.5-flash-lite"), { ...w, cacheHitRate: 0 }, "2026-10-31");
    expect(g.cacheWrite).toBeCloseTo((8000 / 1e6) * 0.3, 10);
  });

  it("uses long-context rates above each threshold, for the whole request", () => {
    const short = workloadCost(model("gpt-6-astra"), { ...base, inputTokens: 272_000 }, "2026-10-31");
    const long = workloadCost(model("gpt-6-astra"), { ...base, inputTokens: 272_001 }, "2026-10-31");
    expect(short.longContext).toBe(false);
    expect(long.longContext).toBe(true);
    expect(long.input).toBeCloseTo((272_001 / 1e6) * 20, 8);
    expect(workloadCost(model("claude-haiku-5-5"), { ...base, inputTokens: 100_001 }, "2026-10-31").longContext).toBe(true);
  });

  it("switches to announced prices on their start date", () => {
    expect(ratesOn(model("gemini-4-argon"), "2026-11-30").rates.input).toBe(2);
    expect(ratesOn(model("gemini-4-argon"), "2026-12-01").rates.input).toBe(4);
    expect(ratesOn(model("gemini-3.8-flash"), "2027-01-01").rates.output).toBe(7.5);
    expect(modelPricing("2026-12-15").find((m) => m.id === "gemini-4-argon")?.inputPer1M).toBe(4);
  });

  it("the price list is internally consistent", () => {
    for (const m of LLM_MODELS) {
      expect(m.change && m.longContext, `${m.id}: change + long context isn't modelled`).toBeFalsy();
      expect(m.rates.cacheRead, m.id).toBeLessThan(m.rates.input);
      expect(m.rates.output, m.id).toBeGreaterThan(m.rates.input);
      if (m.longContext) expect(m.longContext.rates.input, m.id).toBeGreaterThan(m.rates.input);
      expect(PRICING_SOURCES[m.provider]).toMatch(/^https:\/\//);
    }
    expect(new Set(LLM_MODELS.map((m) => m.id)).size).toBe(LLM_MODELS.length);
    for (const p of Object.values(TOKEN_COUNTER_PAGES)) expect(LLM_MODELS.some((m) => m.provider === p.provider)).toBe(true);
  });
});

describe("payment test cards", () => {
  it("every number is Luhn-valid unless the provider lists it as invalid on purpose", () => {
    for (const g of GATEWAYS) {
      expect(g.docs, g.id).toMatch(/^https:\/\//);
      for (const c of g.cards) {
        expect(c.number, `${g.id} ${c.number}`).toMatch(/^\d{13,19}$/);
        expect(luhnIsValid(c.number), `${g.id} ${c.number}`).toBe(!c.luhnInvalid);
      }
    }
    expect(GATEWAYS.find((g) => g.id === "stripe")!.cards.find((c) => c.luhnInvalid)?.number).toBe("4242424242424241");
  });

  it("formats numbers the way cards print them", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(formatCardNumber("36227206271667")).toBe("3622 720627 1667");
    expect(formatCardNumber("6205500000000000004")).toBe("6205 5000 0000 0000 004");
  });
});

describe("JSON path finder", () => {
  const doc = { order: { items: [{ sku: "A", "unit price": 2 }], "post-code": "SW1" } };
  const p = ["order", "items", 0, "unit price"];

  it("writes paths in each style, quoting keys that aren't identifiers", () => {
    expect(formatPath(p, "jsonpath")).toBe("$.order.items[0]['unit price']");
    expect(formatPath(p, "javascript")).toBe('data.order.items[0]["unit price"]');
    expect(formatPath(p, "jq")).toBe('.order.items[0]["unit price"]');
    expect(formatPath(p, "python")).toBe('data["order"]["items"][0]["unit price"]');
    expect(formatPath([], "jsonpath")).toBe("$");
    expect(formatPath([], "jq")).toBe(".");
    expect(formatPath(["a b"], "jq")).toBe('.["a b"]');
    expect(formatPath(["it's"], "jsonpath")).toBe("$['it\\'s']");
  });

  it("turns indexes into wildcards", () => {
    const q = ["order", "items", 0, "sku"];
    expect(formatPath(q, "jsonpath", { wildcard: true })).toBe("$.order.items[*].sku");
    expect(formatPath(q, "jq", { wildcard: true })).toBe(".order.items[].sku");
    expect(formatPath(q, "javascript", { wildcard: true })).toBe("data.order.items.map((item) => item.sku)");
    expect(formatPath(q, "python", { wildcard: true })).toBe('[item["sku"] for item in data["order"]["items"]]');
  });

  it("finds keys and values, and reads back a path", () => {
    expect(searchJson(doc, "post").map((m) => [m.on, formatPath(m.path, "jsonpath")])).toEqual([["key", "$.order['post-code']"]]);
    expect(searchJson(doc, "sw1").map((m) => m.on)).toEqual(["value"]);
    expect(getAt(doc, p)).toBe(2);
  });
});

describe("CIDR merge and VLSM", () => {
  it("parses every input form", () => {
    expect(parseEntry("10.0.0.77/24")).toEqual({ start: ipToNum("10.0.0.0"), end: ipToNum("10.0.0.255") });
    expect(parseEntry("10.0.0.5")).toEqual({ start: ipToNum("10.0.0.5"), end: ipToNum("10.0.0.5") });
    expect(parseEntry("10.0.0.9 - 10.0.0.1")).toEqual({ start: ipToNum("10.0.0.1"), end: ipToNum("10.0.0.9") });
    expect(parseEntry("172.16.0.0 255.255.255.0")).toEqual(parseEntry("172.16.0.0/24"));
    expect("error" in parseEntry("172.16.0.0 255.0.255.0")).toBe(true);
    expect("error" in parseEntry("10.0.0.0/33")).toBe(true);
    const list = parseList("# allowlist\n10.0.0.0/25, 10.0.0.128/25\n1.1.1.1 2.2.2.2\nnope");
    expect(list.ranges).toHaveLength(4);
    expect(list.errors).toHaveLength(1);
  });

  it("merges, subtracts and converts ranges to the fewest blocks", () => {
    expect(rangesToCidrs(mergeRanges(parseList("10.0.0.0/25\n10.0.0.128/25\n10.0.1.0/24\n10.0.0.42").ranges))).toEqual(["10.0.0.0/23"]);
    expect(rangeToCidrs(ipToNum("192.168.1.10")!, ipToNum("192.168.1.20")!)).toEqual(["192.168.1.10/31", "192.168.1.12/30", "192.168.1.16/30", "192.168.1.20/32"]);
    expect(rangeToCidrs(0, 2 ** 32 - 1)).toEqual(["0.0.0.0/0"]);
    const cut = rangesToCidrs(subtractRanges(parseList("10.0.0.0/24").ranges, parseList("10.0.0.64/26").ranges));
    expect(cut).toEqual(["10.0.0.0/26", "10.0.0.128/25"]);
  });

  it("plans VLSM subnets largest first, without overlaps", () => {
    const plan = planVlsm("192.168.1.0/24", [
      { name: "A", hosts: 100 },
      { name: "B", hosts: 50 },
      { name: "C", hosts: 20 },
      { name: "D", hosts: 2 },
    ]);
    expect(plan.ok && plan.subnets.map((s) => s.cidr)).toEqual(["192.168.1.0/25", "192.168.1.128/26", "192.168.1.192/27", "192.168.1.224/30"]);
    expect(plan.ok && plan.free).toEqual(["192.168.1.228/30", "192.168.1.232/29", "192.168.1.240/28"]);
    // 13 hosts need a /28 (14 usable); 30 fit a /27, 31 don't
    const one = (hosts: number, cloud = false) => {
      const r = planVlsm("10.0.0.0/16", [{ name: "x", hosts }], cloud);
      return r.ok ? r.subnets[0].prefix : null;
    };
    expect([one(13), one(30), one(31), one(2), one(1)]).toEqual([28, 27, 26, 30, 30]);
    // AWS: 5 reserved per subnet, /28 smallest, first usable host is .4
    const aws = planVlsm("10.0.0.0/16", [{ name: "db", hosts: 11 }], true);
    expect(aws.ok && [aws.subnets[0].cidr, aws.subnets[0].firstHost, aws.subnets[0].usable]).toEqual(["10.0.0.0/28", "10.0.0.4", 11]);
    expect(one(12, true)).toBe(27);
    expect(planVlsm("10.0.0.0/28", [{ name: "big", hosts: 300 }])).toMatchObject({ ok: false, needed: 512 });
    expect(planVlsm("10.0.0.0", [{ name: "x", hosts: 1 }]).ok).toBe(false);
  });
});

describe("cURL to code", () => {
  const p = parseCurl(`curl -X POST https://api.example.com/x -H "Content-Type: application/json" -H 'X-Token: a$b"c' -d '{"q":"it\\'s"}'`);

  it("keeps quotes and $ intact in every language", () => {
    expect(toPhpCurl(p)).toContain(`'X-Token: a$b"c'`); // single-quoted: $b is not a PHP variable
    expect(toRuby(p)).toContain(`request['X-Token'] = 'a$b"c'`);
    expect(toPowerShell(p)).toContain(`'X-Token' = 'a$b"c'`);
    expect(toWget(p)).toContain(`--header='X-Token: a$b"c'`);
    expect(toJava(p)).toContain(`.header("X-Token", "a$b\\"c")`);
  });

  it("follows each runtime's header rules", () => {
    const cs = toCSharp(p);
    expect(cs).not.toMatch(/Headers\.TryAddWithoutValidation\("Content-Type"/);
    expect(cs).toContain('Encoding.UTF8, "application/json")');
    const withHost = parseCurl(`curl https://x.example -H "Host: other" -H "Accept: */*"`);
    expect(toJava(withHost)).not.toContain('"Host"');
    expect(toJava(withHost)).toContain('.header("Accept", "*/*")');
  });

  it("has a page for languages that exist", () => {
    expect(new Set(LANGUAGES.map((l) => l.id)).size).toBe(LANGUAGES.length);
    for (const page of CURL_LANGUAGE_PAGES) expect(LANGUAGES.some((l) => l.id === page.lang), page.slug).toBe(true);
    for (const l of LANGUAGES) expect(l.generator(p).length, l.id).toBeGreaterThan(20);
  });
});

describe("regex flavors", () => {
  const errors = (pattern: string, flavor: Parameters<typeof checkFlavor>[1]) => checkFlavor(pattern, flavor).filter((f) => f.level === "error").length;

  it("flags syntax another flavor rejects", () => {
    expect(errors("(?<year>\\d{4})", "python")).toBe(1);
    expect(errors("(?P<year>\\d{4})", "javascript")).toBe(1);
    expect(errors("(?P<year>\\d{4})", "go")).toBe(0);
    expect(errors("(?<=\\$)\\d+", "go")).toBe(1);
    expect(errors("(?<=a+)b", "python")).toBe(1);
    expect(errors("(?<=a{2})b", "python")).toBe(0);
    expect(errors("(?<=a+)b", "java")).toBe(1);
    expect(errors("(?<=a{0,9})b", "java")).toBe(0);
    expect(errors("(\\w)\\1", "go")).toBe(1);
    expect(errors("a++", "dotnet")).toBe(1);
    expect(errors("a++", "java")).toBe(0);
    expect(errors("[a+]+", "javascript")).toBe(0); // + inside a class isn't a possessive quantifier
    expect(errors("(?i)abc", "javascript")).toBe(1);
    expect(errors("abc(?i)", "python")).toBe(1);
    expect(errors("\\p{L}", "python")).toBe(1);
    expect(errors("\\h", "pcre")).toBe(0);
    expect(errors("[[:alpha:]]", "java")).toBe(1);
    expect(checkFlavor("\\d+$", "python").map((f) => f.level)).toEqual(["info", "info"]);
    expect(checkFlavor("plain text", "go")).toEqual([]);
  });

  it("translates exact equivalents so other flavors can be tested in the browser", () => {
    const py = toJavaScript("^(?P<u>[a-z]+)(?P=u)$", "python", "");
    expect(py.changed).toBe(true);
    const re = new RegExp(py.pattern, py.flags);
    expect(re.test("abab")).toBe(true);
    // Python's $ allows a trailing newline; JavaScript's doesn't — the translation keeps Python's meaning
    expect(re.test("abab\n")).toBe(true);
    const g = toJavaScript("(?i)^abc$", "go", "");
    expect(new RegExp(g.pattern, g.flags).test("ABC")).toBe(true);
    expect(new RegExp(g.pattern, g.flags).test("ABC\n")).toBe(false);
    const z = toJavaScript("\\Aab\\Z", "java", "");
    expect(new RegExp(z.pattern).test("ab\n")).toBe(true);
    expect(toJavaScript("\\Aab\\Z", "python", "").pattern).toBe("(?<![\\s\\S])ab(?![\\s\\S])");
    expect(toJavaScript("abc", "javascript", "g")).toEqual({ pattern: "abc", flags: "g", changed: false });
  });

  it("writes snippets with the right string syntax", () => {
    expect(regexSnippet("\\d+", "g", "python")).toContain("re.compile(r'\\d+')");
    expect(regexSnippet("it's \\d", "", "python")).toContain('r"it\'s \\d"');
    expect(regexSnippet("a\\", "", "python")).toContain('"a\\\\"'); // a raw string can't end in one backslash
    expect(regexSnippet("\\d+", "i", "java")).toContain('Pattern.compile("\\\\d+", Pattern.CASE_INSENSITIVE)');
    expect(regexSnippet('say "hi"', "", "dotnet")).toContain('@"say ""hi"""');
    expect(regexSnippet("\\d+", "im", "go")).toContain("regexp.MustCompile(`(?im)\\d+`)");
    expect(regexSnippet("a/b", "", "pcre")).toContain("'/a\\\\/b/u'");
    expect(regexSnippet("a/b", "g", "javascript")).toContain("/a\\/b/g");
  });

  it("every flavor has its page content", () => {
    for (const f of FLAVORS) expect(FLAVOR_PAGES[f.id].faq.length, f.id).toBeGreaterThan(1);
  });
});

describe("barcodes", () => {
  it("computes GS1 check digits", () => {
    expect(gs1CheckDigit("400638133393")).toBe(1);
    expect(gs1CheckDigit("9638507")).toBe(4);
    expect(gs1CheckDigit("0001234567890")).toBe(5);
  });

  it("encodes EAN-8, Code 39 and ITF-14 at the right sizes", () => {
    expect(encodeEAN8("9638507")).toMatchObject({ displayText: "96385074" });
    expect(encodeEAN8("9638507").modules).toHaveLength(67);
    expect(() => encodeEAN8("96385075")).toThrow(/check digit/);
    const c39 = encodeCode39("ab-1");
    expect(c39.displayText).toBe("*AB-1*");
    expect(c39.modules).toHaveLength(6 * 15 + 5); // 6 characters of 15 modules, 5 gaps
    expect(() => encodeCode39("a*b")).toThrow(/Code 39/);
    expect(() => encodeCode39("é")).toThrow(/Code 39/);
    const itf = encodeITF14("1540014128876");
    expect(itf.displayText).toBe("15400141288763");
    expect(itf.modules).toHaveLength(4 + 7 * 18 + 5);
    expect(itf.modules.startsWith("1010")).toBe(true);
    expect(itf.modules.endsWith("11101")).toBe(true);
  });

  it("every barcode page uses a format the generator supports", () => {
    for (const page of BARCODE_PAGES) expect(() => generateBarcode(page.format, page.format === "code39" ? "ABC" : page.format === "code128" ? "abc" : "1".repeat(page.format === "ean8" ? 7 : page.format === "upca" ? 11 : page.format === "ean13" ? 12 : 13)), page.slug).not.toThrow();
  });
});

describe("URL header check guard", () => {
  it("only treats public addresses as public", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a9fe:a9fe", "2002:c0a8:0101::1", "not-an-ip"])
      expect(isPublicAddress(ip), ip).toBe(false);
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) expect(isPublicAddress(ip), ip).toBe(true);
  });

  it("refuses internal names, odd ports, credentials and other schemes before connecting", async () => {
    expect(await resolvePublic("localhost")).toMatchObject({ error: expect.any(String) });
    expect(await resolvePublic("printer.local")).toMatchObject({ error: expect.any(String) });
    expect(await resolvePublic("169.254.169.254")).toMatchObject({ error: expect.any(String) });
    expect(await fetchHeaders("ftp://example.com")).toMatchObject({ ok: false });
    expect(await fetchHeaders("https://user:pass@example.com")).toMatchObject({ ok: false, error: expect.stringMatching(/username/) });
    expect(await fetchHeaders("https://example.com:8443")).toMatchObject({ ok: false, error: expect.stringMatching(/port/) });
    expect(await fetchHeaders("http://127.0.0.1/")).toMatchObject({ ok: false, error: expect.stringMatching(/private/) });
    expect(await fetchHeaders("http://[::1]/")).toMatchObject({ ok: false, error: expect.stringMatching(/private/) });
  });
});
