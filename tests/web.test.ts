import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/user-agent-parser";
import { checkCors, type CorsCheckInput } from "@/lib/cors-debugger";
import { convertHtaccessToNginx } from "@/lib/htaccess-to-nginx";

describe("User-Agent parser", () => {
  it("Chrome on Windows", () => {
    const r = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
    expect(r.browser).toEqual({ name: "Chrome", version: "141.0.0.0" });
    expect(r.engine?.name).toBe("Blink");
    expect(r.os).toEqual({ name: "Windows", version: "10 / 11" });
    expect(r.device.type).toBe("desktop");
    expect(r.isBot).toBe(false);
  });

  it("Edge is not reported as Chrome", () => {
    const r = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.3537.71");
    expect(r.browser?.name).toBe("Edge");
  });

  it("Firefox on macOS", () => {
    const r = parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:132.0) Gecko/20100101 Firefox/132.0");
    expect(r.browser).toEqual({ name: "Firefox", version: "132.0" });
    expect(r.os?.name).toBe("macOS");
  });

  it("Safari on iPhone", () => {
    const r = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1");
    expect(r.browser).toEqual({ name: "Safari", version: "18.1" });
    expect(r.os).toEqual({ name: "iOS", version: "18.1" });
    expect(r.device).toMatchObject({ type: "mobile", model: "iPhone" });
  });

  it("Android phone vs tablet", () => {
    const phone = parseUserAgent("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36");
    expect(phone.os).toEqual({ name: "Android", version: "15" });
    expect(phone.device.type).toBe("mobile");
    const tablet = parseUserAgent("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
    expect(tablet.device.type).toBe("tablet");
  });

  it("bots and CLI clients", () => {
    expect(parseUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toMatchObject({ isBot: true, browser: { name: "Googlebot", version: "2.1" }, device: { type: "bot" } });
    expect(parseUserAgent("curl/8.7.1").browser).toEqual({ name: "curl", version: "8.7.1" });
    expect(parseUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)").browser?.name).toBe("ClaudeBot");
  });

  it("empty input", () => {
    expect(parseUserAgent("")).toMatchObject({ browser: null, os: null, isBot: false });
  });
});

describe("CORS debugger — follows the Fetch spec's CORS checks", () => {
  const base: CorsCheckInput = {
    origin: "https://app.example.com",
    method: "GET",
    requestHeaders: [],
    contentType: "",
    withCredentials: false,
    responseHeaders: {},
  };

  it("simple GET with a wildcard origin is allowed without a preflight", () => {
    const r = checkCors({ ...base, responseHeaders: { "Access-Control-Allow-Origin": "*" } });
    expect(r.needsPreflight).toBe(false);
    expect(r.verdict).toBe("allowed");
  });

  it("missing Access-Control-Allow-Origin is blocked", () => {
    expect(checkCors(base).verdict).toBe("blocked");
  });

  it("origin must match exactly", () => {
    expect(checkCors({ ...base, responseHeaders: { "access-control-allow-origin": "https://example.com" } }).verdict).toBe("blocked");
    expect(checkCors({ ...base, responseHeaders: { "access-control-allow-origin": "https://app.example.com" } }).verdict).toBe("allowed");
  });

  it("credentials: wildcard origin is never allowed, and Allow-Credentials must be 'true'", () => {
    expect(checkCors({ ...base, withCredentials: true, responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-credentials": "true" } }).verdict).toBe("blocked");
    expect(checkCors({ ...base, withCredentials: true, responseHeaders: { "access-control-allow-origin": base.origin } }).verdict).toBe("blocked");
    expect(checkCors({ ...base, withCredentials: true, responseHeaders: { "access-control-allow-origin": base.origin, "access-control-allow-credentials": "true" } }).verdict).toBe("allowed");
  });

  it("PUT needs a preflight and must be listed in Allow-Methods", () => {
    const put = { ...base, method: "PUT" };
    expect(checkCors({ ...put, responseHeaders: { "access-control-allow-origin": "*" } }).verdict).toBe("blocked");
    expect(checkCors({ ...put, responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, PUT" } }).verdict).toBe("allowed");
  });

  it("JSON POST needs content-type in Allow-Headers", () => {
    const json = { ...base, method: "POST", contentType: "application/json" };
    const r = checkCors({ ...json, responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST" } });
    expect(r.needsPreflight).toBe(true);
    expect(r.verdict).toBe("blocked");
    expect(checkCors({ ...json, responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-headers": "Content-Type" } }).verdict).toBe("allowed");
  });

  it("GET/HEAD/POST are always allowed after a preflight, even if Allow-Methods omits them", () => {
    const r = checkCors({ ...base, method: "GET", requestHeaders: ["X-Api-Key"], responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-headers": "x-api-key" } });
    expect(r.needsPreflight).toBe(true);
    expect(r.verdict).toBe("allowed");
  });

  it("'*' in Allow-Methods / Allow-Headers is a wildcard only without credentials", () => {
    const req = { ...base, method: "DELETE", requestHeaders: ["X-Trace"] };
    expect(checkCors({ ...req, responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-methods": "*", "access-control-allow-headers": "*" } }).verdict).toBe("allowed");
    const cred = { ...req, withCredentials: true };
    expect(
      checkCors({
        ...cred,
        responseHeaders: { "access-control-allow-origin": base.origin, "access-control-allow-credentials": "true", "access-control-allow-methods": "*", "access-control-allow-headers": "*" },
      }).verdict
    ).toBe("blocked");
  });

  it("'*' in Allow-Headers never covers Authorization", () => {
    const r = checkCors({ ...base, requestHeaders: ["Authorization"], responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    expect(r.verdict).toBe("blocked");
    expect(checkCors({ ...base, requestHeaders: ["Authorization"], responseHeaders: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization" } }).verdict).toBe("allowed");
  });
});

describe(".htaccess → nginx", () => {
  const convert = (s: string) => convertHtaccessToNginx(s);

  it("HTTPS redirect becomes a $scheme check", () => {
    const r = convert(String.raw`RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`);
    expect(r.output).toContain('if ($scheme != "https") {');
    expect(r.output).toContain("return 301 https://$host$request_uri;");
    expect(r.warnings).toEqual([]);
  });

  it("host redirect keeps regex escapes and uses $request_uri for the path", () => {
    const r = convert(String.raw`RewriteCond %{HTTP_HOST} ^example\.com$ [NC]
RewriteRule ^(.*)$ https://www.example.com/$1 [L,R=301]`);
    expect(r.output).toContain(String.raw`if ($host ~* "^example\.com$") {`);
    expect(r.output).toContain("return 301 https://www.example.com$request_uri;");
  });

  it("WordPress block becomes try_files and emits no invalid rewrite", () => {
    const r = convert(String.raw`<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>`);
    expect(r.output).toContain("try_files $uri $uri/ /index.php?$args;");
    // Apache's "-" means "no substitution"; nginx has no such target
    expect(r.output).not.toMatch(/rewrite \S+ - /);
  });

  it("'-' target with [F] / [G] becomes 403 / 410", () => {
    expect(convert(String.raw`RewriteRule ^secret/ - [F]`).output).toContain("return 403;");
    expect(convert(String.raw`RewriteRule ^gone\.html$ - [G]`).output).toContain("return 410;");
  });

  it("Redirect, ErrorDocument, DirectoryIndex and <Files> deny", () => {
    expect(convert("Redirect 301 /old-page /new-page").output).toContain("location = /old-page {\n    return 301 /new-page;\n}");
    expect(convert("ErrorDocument 404 /404.html").output).toContain("error_page 404 /404.html;");
    expect(convert("DirectoryIndex index.html").output).toContain("index index.html;");
    expect(convert("<Files .env>\nDeny from all\n</Files>").output).toContain("location = /.env {\n    deny all;\n}");
  });

  it("warns instead of silently dropping unknown directives", () => {
    const r = convert("SetEnvIf Foo bar");
    expect(r.output.trim()).toBe("");
    expect(r.warnings[0]).toMatch(/Not translated/);
  });
});
