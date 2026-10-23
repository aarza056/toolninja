import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { networkId, visitorId, originAllowed, allowedOrigins } from "@/lib/visitor";
import { tools, categories } from "@/lib/tools";
import { analyzeHeaders } from "@/lib/security-headers";
import { renderToolsSection, START, END } from "../scripts/readme-tools.mjs";
import nextConfig from "../next.config.mjs";

const req = (headers: Record<string, string>) => new Request("https://toolninja.io/api/x", { headers });

describe("visitor identity (rate limits, vote de-duplication)", () => {
  it("IPv4 is used as-is", () => {
    expect(networkId("203.0.113.7")).toBe("203.0.113.7");
  });

  it("IPv6 addresses in the same /64 share one identity", () => {
    const a = networkId("2001:db8:1:2:3:4:5:6");
    expect(a).toBe("2001:0db8:0001:0002::/64");
    expect(networkId("2001:db8:1:2:ffff::1")).toBe(a);
    expect(networkId("2001:0DB8:0001:0002:0000:0000:0000:0001")).toBe(a);
    expect(networkId("2001:db8:1:3::1")).not.toBe(a);
  });

  it("IPv4-mapped IPv6 is treated as the IPv4 address", () => {
    expect(networkId("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("the User-Agent does not change the visitor id", () => {
    const ip = "198.51.100.4";
    const a = visitorId(req({ "x-forwarded-for": ip, "user-agent": "Chrome" }));
    const b = visitorId(req({ "x-forwarded-for": ip, "user-agent": "Firefox" }));
    const c = visitorId(req({ "x-forwarded-for": "198.51.100.5", "user-agent": "Chrome" }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain(ip); // hashed, never the IP itself
  });

  it("uses the first x-forwarded-for entry", () => {
    expect(visitorId(req({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }))).toBe(visitorId(req({ "x-forwarded-for": "198.51.100.4" })));
  });
});

describe("origin allowlist", () => {
  const prod = { NODE_ENV: "production" };
  const withOrigin = (o: string) => req({ origin: o });

  it("allows the production domains and same-origin requests without an Origin", () => {
    expect(originAllowed(withOrigin("https://toolninja.io"), prod)).toBe(true);
    expect(originAllowed(withOrigin("https://www.toolninja.io"), prod)).toBe(true);
    expect(originAllowed(req({}), prod)).toBe(true);
  });

  it("rejects other Vercel-hosted sites", () => {
    expect(originAllowed(withOrigin("https://evil.vercel.app"), prod)).toBe(false);
    expect(originAllowed(withOrigin("https://toolninja-evil.vercel.app"), prod)).toBe(false);
  });

  it("allows this deployment's own Vercel URLs from Vercel's system env vars", () => {
    const env = { NODE_ENV: "production", VERCEL_URL: "toolninja-abc123-team.vercel.app", VERCEL_BRANCH_URL: "toolninja-git-main-team.vercel.app" };
    expect(allowedOrigins(env)).toContain("https://toolninja-abc123-team.vercel.app");
    expect(originAllowed(withOrigin("https://toolninja-git-main-team.vercel.app"), env)).toBe(true);
    expect(originAllowed(withOrigin("https://toolninja-other-team.vercel.app"), env)).toBe(false);
  });

  it("allows localhost only outside production", () => {
    expect(originAllowed(withOrigin("http://localhost:3000"), { NODE_ENV: "development" })).toBe(true);
    expect(originAllowed(withOrigin("http://localhost:3000"), prod)).toBe(false);
    expect(originAllowed(withOrigin("http://localhost.evil.com"), { NODE_ENV: "development" })).toBe(false);
  });
});

describe("tool registry", () => {
  it("every tool in lib/tools.ts has a page", () => {
    const missing = tools.filter((t) => !existsSync(join(__dirname, "..", "app", "tools", t.slug, "page.tsx"))).map((t) => t.slug);
    expect(missing).toEqual([]);
  });

  it("slugs are unique", () => {
    expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
  });
});

describe("README", () => {
  it("lists every tool from lib/tools.ts (run `npm run readme:tools` to update)", () => {
    const readme = readFileSync(join(__dirname, "..", "README.md"), "utf8");
    const block = readme.slice(readme.indexOf(START), readme.indexOf(END) + END.length);
    expect(block).toBe(renderToolsSection(tools, categories));
    expect(block).toContain(`(${tools.length} total)`);
  });
});

describe("security headers (next.config.mjs, checked with the site's own analyzer)", () => {
  it("passes the Security Headers Checker except the documented 'unsafe-inline' gap", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/(.*)")!.headers;
    const raw = all.map((h) => `${h.key}: ${h.value}`).join("\n");
    const report = analyzeHeaders(raw);
    const byName = Object.fromEntries(report.checks.map((c) => [c.name, c]));

    expect(byName["x-xss-protection"].message).toBe("Present and looks correctly configured.");
    expect(byName["x-frame-options"].value).toBe("DENY");
    expect(byName["strict-transport-security"].message).toBe("Present and looks correctly configured.");
    expect(byName["referrer-policy"].message).toBe("Present and looks correctly configured.");
    expect(byName["content-security-policy"].value).not.toContain("unsafe-eval");
    expect(byName["content-security-policy"].value).toContain("frame-ancestors 'none'");
    // Static pages still need 'unsafe-inline' for Next's inline scripts — see middleware.ts for /admin
    expect(byName["content-security-policy"].message).toMatch(/unsafe-inline/);
    expect(report.criticalMissing).toBe(0);
  });
});
