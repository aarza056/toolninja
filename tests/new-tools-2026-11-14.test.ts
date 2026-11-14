import { describe, expect, it } from "vitest";
import { matchLocation, normalizeUri, parseNginxConfig, NGINX_EXAMPLE } from "@/lib/nginx-location";
import { awsAccountFromKeyId, base62, crc32, identifyKey, cleanKey } from "@/lib/api-key-id";
import { chooseGroups, parseRobotsFull, testPath, ROBOTS_EXAMPLE, statusMeaning, normalizePath } from "@/lib/robots-test";
import { evaluateFavicons, readImage, readManifest, readPageIcons, type FaviconReport } from "@/lib/favicon-check";
import { runJmes, SAMPLE_EC2, SAMPLE_PEOPLE, JMES_EXAMPLES, cliCommands } from "@/lib/jmespath-tool";

const at = (cfg: string, uri: string) => {
  const parsed = parseNginxConfig(cfg);
  const r = matchLocation(parsed, uri);
  return r.location ? `${r.location.modifier} ${r.location.pattern}`.trim() : null;
};

describe("nginx location tester", () => {
  it("follows nginx's order: exact, ^~, regex, longest prefix", () => {
    expect(at(NGINX_EXAMPLE, "/")).toBe("= /");
    expect(at(NGINX_EXAMPLE, "/about")).toBe("/");
    expect(at(NGINX_EXAMPLE, "/api/users")).toBe("/api/");
    // ^~ stops the regex search, even though the image regex would match
    expect(at(NGINX_EXAMPLE, "/static/logo.png")).toBe("^~ /static/");
    // ~* is case-insensitive and beats the / prefix
    expect(at(NGINX_EXAMPLE, "/images/logo.PNG")).toBe("~* \\.(jpg|jpeg|png|gif|webp|svg)$");
    expect(at(NGINX_EXAMPLE, "/index.php?page=2")).toBe("~ \\.php$");
  });

  it("captures named and numbered groups", () => {
    const r = matchLocation(parseNginxConfig(NGINX_EXAMPLE), "/users/42/avatar");
    expect(r.named.id).toBe("42");
    expect(r.captures).toEqual(["42"]);
  });

  it("uses the first matching regex in config order, not the longest", () => {
    const cfg = "location ~ \\.php$ { a; }\nlocation ~ ^/admin/.*\\.php$ { b; }";
    expect(at(cfg, "/admin/x.php")).toBe("~ \\.php$");
  });

  it("redirects /api to /api/ when the slash location proxies", () => {
    const r = matchLocation(parseNginxConfig(NGINX_EXAMPLE), "/api");
    expect(r.redirect).toBe("/api/");
  });

  it("tries nested regexes first, even inside a ^~ location", () => {
    const cfg = "location ^~ /static/ { location ~ \\.css$ { inner; } }\nlocation ~ \\.css$ { outer; }";
    const parsed = parseNginxConfig(cfg);
    const r = matchLocation(parsed, "/static/a.css");
    expect(r.location?.directives).toEqual(["inner;".replace(";", "")]);
    expect(matchLocation(parsed, "/static/a.js").location?.pattern).toBe("/static/");
  });

  it("normalizes the URI like nginx", () => {
    expect(normalizeUri("https://example.com//a/./b/../c%20d?x=1").uri).toBe("/a/c d");
    expect(normalizeUri("/../etc/passwd").error).toBeTruthy();
  });

  it("warns about duplicate locations and missing braces", () => {
    const p = parseNginxConfig("location /a { }\nlocation /a { }\nlocation /b {");
    expect(p.warnings.some((w) => /duplicate/.test(w))).toBe(true);
    expect(p.warnings.some((w) => /isn't closed/.test(w))).toBe(true);
  });

  it("reads modifiers attached to the pattern and quoted regexes", () => {
    const p = parseNginxConfig('location =/x { }\nlocation ~*"\\.(gif)$" { }\nlocation ~ "^/d{3}$" { }');
    expect(p.all.map((l) => l.modifier)).toEqual(["=", "~*", "~"]);
    expect(at('location ~ "^/\\d{3}$" { }', "/123")).toBe("~ ^/\\d{3}$");
  });
});

describe("API key identifier", () => {
  it("decodes the AWS account ID from an access key ID", () => {
    expect(awsAccountFromKeyId("ASIAY34FZKBOKMUTVV7A")).toBe("609629065308");
    const r = identifyKey("ASIAY34FZKBOKMUTVV7A");
    expect(r.matches[0].service).toBe("AWS");
    expect(r.matches[0].facts.find((f) => /account/i.test(f.label))?.value).toBe("609629065308");
  });

  it("checks GitHub and npm checksums", () => {
    const entropy = "abcdefghijklmnopqrstuvwxyz0123";
    const good = `ghp_${entropy}${base62(crc32(entropy), 6)}`;
    expect(identifyKey(good).matches[0].facts.find((f) => f.label === "Checksum")?.tone).toBe("good");
    const bad = `${good.slice(0, -1)}${good.endsWith("A") ? "B" : "A"}`;
    expect(identifyKey(bad).matches[0].facts.find((f) => f.label === "Checksum")?.tone).toBe("bad");
    expect(identifyKey(`npm_${entropy}${base62(crc32(entropy), 6)}`).matches[0].facts[0].tone).toBe("good");
    expect(crc32("123456789")).toBe(0xcbf43926);
  });

  it("tells Stripe secret, publishable and test keys apart", () => {
    const sk = identifyKey("sk_live_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3");
    expect(sk.matches[0]).toMatchObject({ service: "Stripe", kind: "secret", environment: "live" });
    expect(identifyKey("pk_test_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3").matches[0]).toMatchObject({ kind: "public", environment: "test" });
  });

  it("recognizes AI provider keys", () => {
    expect(identifyKey("sk-ant-api03-" + "A".repeat(93) + "AA").matches[0].service).toBe("Anthropic");
    expect(identifyKey("sk-proj-" + "a".repeat(40)).matches[0].service).toBe("OpenAI");
    expect(identifyKey("sk-" + "a".repeat(20) + "T3BlbkFJ" + "b".repeat(20)).matches[0].name).toMatch(/Legacy/);
  });

  it("decodes Discord bot IDs and Telegram bot IDs", () => {
    const id = "1234567890123456789";
    const tok = `${btoa(id).replace(/=+$/, "")}.GhIjKl.${"x".repeat(38)}`;
    const d = identifyKey(tok);
    expect(d.matches[0].service).toBe("Discord");
    expect(d.matches[0].facts[0].value).toBe(id);
    expect(identifyKey("123456789:AAH" + "a".repeat(32)).matches[0].facts[0].value).toBe("123456789");
  });

  it("reads JWT claims and spots Supabase service_role keys", () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", role: "service_role", ref: "abcd" })}.sig_part_here`;
    const r = identifyKey(jwt);
    expect(r.matches[0]).toMatchObject({ service: "Supabase", kind: "secret" });
    expect(r.matches[0].facts.some((f) => f.label === "Expires" && /Never/.test(f.value))).toBe(true);
  });

  it("strips what people paste around a key", () => {
    expect(cleanKey('OPENAI_API_KEY="sk-proj-abc"').key).toBe("sk-proj-abc");
    expect(cleanKey("Authorization: Bearer ghp_x").key).toBe("ghp_x");
  });

  it("recognizes PEM private keys and service account files", () => {
    expect(identifyKey("-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----").matches[0].service).toBe("Private key");
    const sa = JSON.stringify({ type: "service_account", project_id: "demo", private_key: "-----BEGIN PRIVATE KEY-----", client_email: "x@demo.iam.gserviceaccount.com" });
    expect(identifyKey(sa).matches.map((m) => m.service)).toContain("Google Cloud");
  });

  it("flags placeholders and finds nothing in random text", () => {
    expect(identifyKey("your_api_key_here").placeholder).toBe(true);
    expect(identifyKey("hello world").matches).toEqual([]);
  });
});

describe("robots.txt tester", () => {
  const parsed = parseRobotsFull(ROBOTS_EXAMPLE);

  it("applies the longest match, with Allow winning ties", () => {
    const star = chooseGroups(parsed, "Bingbot");
    expect(testPath(star, "/admin/settings").allowed).toBe(false);
    expect(testPath(star, "/admin/public/logo.png").allowed).toBe(true);
    expect(testPath(star, "/files/report.pdf").allowed).toBe(false);
    expect(testPath(star, "/files/report.pdf?v=2").allowed).toBe(true);
    expect(testPath(star, "https://example.com/products?sort=price").allowed).toBe(false);
    const tie = chooseGroups(parseRobotsFull("User-agent: *\nDisallow: /page\nAllow: /page"), "x");
    expect(testPath(tie, "/page").allowed).toBe(true);
  });

  it("gives a named crawler only its own group", () => {
    const g = chooseGroups(parsed, "Googlebot");
    expect(testPath(g, "/admin/settings").allowed).toBe(true);
    expect(testPath(g, "/drafts/x").allowed).toBe(false);
    expect(g.reason).toMatch(/ignores the \* group/);
    expect(testPath(chooseGroups(parsed, "ClaudeBot"), "/").allowed).toBe(false);
  });

  it("falls back from Googlebot-Image to Googlebot, and AdsBot ignores *", () => {
    expect(chooseGroups(parsed, "Googlebot-Image").matched).toBe("Googlebot");
    const ads = chooseGroups(parseRobotsFull("User-agent: *\nDisallow: /"), "AdsBot-Google");
    expect(testPath(ads, "/").allowed).toBe(true);
  });

  it("always allows /robots.txt and normalizes percent-encoding", () => {
    const all = chooseGroups(parseRobotsFull("User-agent: *\nDisallow: /"), "x");
    expect(testPath(all, "/robots.txt").allowed).toBe(true);
    expect(normalizePath("/caf%c3%a9/%41")).toBe("/caf%C3%A9/A");
    const g = chooseGroups(parseRobotsFull("User-agent: *\nDisallow: /café"), "x");
    expect(testPath(g, "/caf%C3%A9/menu").allowed).toBe(false);
  });

  it("reports common mistakes", () => {
    const p = parseRobotsFull("Disallow: /x\nUser-agent: *\nNoindex: /a\nDissallow: /b\nCrawl-delay: 5\nSitemap: /sitemap.xml");
    const msgs = p.issues.map((i) => i.message).join("\n");
    expect(msgs).toMatch(/before any User-agent/);
    expect(msgs).toMatch(/stopped honoring/);
    expect(msgs).toMatch(/misspelling/);
    expect(msgs).toMatch(/Googlebot ignores Crawl-delay/);
    expect(msgs).toMatch(/full URL/);
  });

  it("explains robots.txt status codes", () => {
    expect(statusMeaning(404).verdict).toBe("allow-all");
    expect(statusMeaning(503).verdict).toBe("disallow-all");
    expect(statusMeaning(200).verdict).toBe("rules");
  });
});

describe("favicon checker", () => {
  const png = (w: number, h: number) => {
    const b = new Uint8Array(24);
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    new DataView(b.buffer).setUint32(16, w);
    new DataView(b.buffer).setUint32(20, h);
    return b;
  };

  it("reads real sizes from PNG, ICO, SVG and GIF bytes", () => {
    expect(readImage(png(180, 180))).toMatchObject({ format: "png", width: 180, height: 180 });
    const ico = new Uint8Array(6 + 32);
    ico.set([0, 0, 1, 0, 2, 0]);
    ico.set([16, 16, 0, 0, 1, 0, 32, 0], 6);
    ico.set([0, 0, 0, 0, 1, 0, 32, 0], 22); // 0 means 256
    const r = readImage(ico);
    expect(r.format).toBe("ico");
    expect(r.frames?.map((f) => f.width)).toEqual([16, 256]);
    expect(readImage(new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"></svg>'))).toMatchObject({ format: "svg", width: 64 });
    expect(readImage(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 32, 0, 32, 0]))).toMatchObject({ format: "gif", width: 32 });
  });

  it("finds icon links and the manifest in HTML", () => {
    const html = `<head><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" sizes="180x180" href="apple.png"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="x.css"></head>`;
    const p = readPageIcons(html, "https://example.com/blog/");
    expect(p.icons.map((i) => i.href)).toEqual(["https://example.com/favicon.svg", "https://example.com/blog/apple.png"]);
    expect(p.manifest).toBe("https://example.com/site.webmanifest");
    const m = readManifest('{"name":"X","icons":[{"src":"/i192.png","sizes":"192x192"},{"src":"/i512.png","sizes":"512x512","purpose":"maskable"}]}', "https://example.com/site.webmanifest");
    expect(m.icons).toHaveLength(2);
  });

  it("builds a checklist that catches wrong sizes", () => {
    const report: FaviconReport = {
      pageUrl: "https://example.com/",
      pageStatus: 200,
      manifestUrl: null,
      manifest: null,
      manifestStatus: null,
      themeColor: null,
      icons: [
        { href: "https://example.com/favicon.ico", rel: "icon", source: "default", status: 404 },
        { href: "https://example.com/icon.png", rel: "icon", sizes: "32x32", type: "image/png", source: "html", status: 200, contentType: "image/png", bytes: 900, image: { format: "png", width: 16, height: 16 } },
        { href: "https://example.com/apple.png", rel: "apple-touch-icon", source: "html", status: 200, contentType: "image/png", bytes: 5000, image: { format: "png", width: 152, height: 152 } },
      ],
    };
    const checks = evaluateFavicons(report);
    const byId = Object.fromEntries(checks.map((c) => [c.id, c.state]));
    expect(byId.root).toBe("warn");
    expect(byId.apple).toBe("warn");
    expect(byId.mismatch).toBe("warn");
    expect(byId.google).toBe("warn");
  });
});

describe("JMESPath tester", () => {
  it("runs every example without an error", () => {
    for (const ex of JMES_EXAMPLES) {
      const r = runJmes(ex.query, ex.data === "ec2" ? SAMPLE_EC2 : SAMPLE_PEOPLE);
      expect(r.ok, `${ex.label}: ${r.error}`).toBe(true);
      expect(r.value, ex.label).not.toBeNull();
    }
  });

  it("gives the expected AWS answers", () => {
    expect(runJmes("Reservations[].Instances[?State.Name=='running'].InstanceId[]", SAMPLE_EC2).value).toEqual(["i-0123456789abcdef0", "i-0a0b0c0d0e0f01234"]);
    expect(runJmes("length(Reservations[].Instances[])", SAMPLE_EC2).value).toBe(3);
    expect(runJmes("sort_by(Reservations[].Instances[], &LaunchTime)[-1].InstanceId", SAMPLE_EC2).value).toBe("i-0a0b0c0d0e0f01234");
  });

  it("explains errors and quotes queries for the shell", () => {
    const r = runJmes('people[?name == "Ada"]', SAMPLE_PEOPLE);
    // "Ada" is a field reference, not a string: valid, but it matches nothing
    expect(r.ok).toBe(true);
    expect(r.value).toEqual([]);
    expect(runJmes("people[?", SAMPLE_PEOPLE).ok).toBe(false);
    expect(runJmes("nope(people)", SAMPLE_PEOPLE).error).toMatch(/Unknown function/i);
    expect(cliCommands("a[?b=='c']")[0].code).toContain(`--query 'a[?b=='\\''c'\\'']'`);
  });
});
