import type { ParsedCurl } from "./curl-parser";

// One generator per language. Every value from the curl command goes through that language's own
// string-literal escaping, so quotes, backslashes, $ and newlines in headers or bodies stay intact.

function entries(p: ParsedCurl): [string, string][] {
  return Object.entries(p.headers);
}

/** "..." literal for languages whose escapes match JSON's (JS, Python, Go, Java, C#) */
const dq = (s: string) => JSON.stringify(s);
/** "..." literal with \u{…} escapes (Rust, Swift) */
const dqBraced = (s: string) => JSON.stringify(s).replace(/\\u([0-9a-fA-F]{4})/g, "\\u{$1}");
/** '...' literal where only backslash and quote are special (PHP, Ruby) */
const sqBackslash = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
/** PowerShell '...' literal: a quote is doubled */
const sqDouble = (s: string) => `'${s.replace(/'/g, "''")}'`;
/** POSIX shell '...' literal */
const sh = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

const contentType = (p: ParsedCurl) => entries(p).find(([k]) => k.toLowerCase() === "content-type")?.[1];

export function toJsFetch(p: ParsedCurl): string {
  const hdrs = entries(p);
  const headerObj = hdrs.length ? `{\n${hdrs.map(([k, v]) => `    ${dq(k)}: ${dq(v)}`).join(",\n")}\n  }` : "{}";
  const opts = [`method: ${dq(p.method)}`, `headers: ${headerObj}`];
  if (p.body) opts.push(`body: ${dq(p.body)}`);
  return `const response = await fetch(${dq(p.url)}, {\n  ${opts.join(",\n  ")}\n});\n\nconst data = await response.text();\nconsole.log(response.status, data);`;
}

export function toNodeAxios(p: ParsedCurl): string {
  const hdrs = entries(p);
  const headerObj = hdrs.length ? `{\n${hdrs.map(([k, v]) => `    ${dq(k)}: ${dq(v)}`).join(",\n")}\n  }` : "{}";
  const lines = [`const axios = require("axios");`, ``, `axios({`, `  method: ${dq(p.method.toLowerCase())},`, `  url: ${dq(p.url)},`, `  headers: ${headerObj},`];
  if (p.body) lines.push(`  data: ${dq(p.body)},`);
  lines.push(`})`, `  .then((res) => console.log(res.data))`, `  .catch((err) => console.error(err));`);
  return lines.join("\n");
}

function pythonLike(p: ParsedCurl, lib: "requests" | "httpx"): string {
  const hdrs = entries(p);
  const headerDict = hdrs.length ? `{\n${hdrs.map(([k, v]) => `    ${dq(k)}: ${dq(v)}`).join(",\n")}\n}` : "{}";
  const lines = [`import ${lib}`, "", `url = ${dq(p.url)}`, `headers = ${headerDict}`];
  if (p.body) lines.push(`data = ${dq(p.body)}`);
  const call = lib === "requests" ? "requests.request" : "httpx.request";
  lines.push("", `response = ${call}(${dq(p.method)}, url, headers=headers${p.body ? `, ${lib === "httpx" ? "content" : "data"}=data` : ""})`, "", "print(response.status_code, response.text)");
  return lines.join("\n");
}

export const toPythonRequests = (p: ParsedCurl) => pythonLike(p, "requests");
export const toPythonHttpx = (p: ParsedCurl) => pythonLike(p, "httpx");

export function toPhpCurl(p: ParsedCurl): string {
  const hdrs = entries(p).map(([k, v]) => `        ${sqBackslash(`${k}: ${v}`)},`);
  const lines = ["<?php", "", "$curl = curl_init();", "", "curl_setopt_array($curl, [", `    CURLOPT_URL => ${sqBackslash(p.url)},`, "    CURLOPT_RETURNTRANSFER => true,", `    CURLOPT_CUSTOMREQUEST => ${sqBackslash(p.method)},`];
  if (p.body) lines.push(`    CURLOPT_POSTFIELDS => ${sqBackslash(p.body)},`);
  if (hdrs.length) lines.push("    CURLOPT_HTTPHEADER => [", ...hdrs, "    ],");
  lines.push("]);", "", "$response = curl_exec($curl);", "curl_close($curl);", "", "echo $response;");
  return lines.join("\n");
}

export function toGoHttp(p: ParsedCurl): string {
  const hdrs = entries(p);
  const imports = ['"fmt"', '"io"', '"net/http"'];
  if (p.body) imports.push('"strings"');
  const lines = ["package main", "", "import (", ...imports.map((i) => `\t${i}`), ")", "", "func main() {"];
  if (p.body) {
    lines.push(`\tbody := strings.NewReader(${dq(p.body)})`);
    lines.push(`\treq, err := http.NewRequest(${dq(p.method)}, ${dq(p.url)}, body)`);
  } else {
    lines.push(`\treq, err := http.NewRequest(${dq(p.method)}, ${dq(p.url)}, nil)`);
  }
  lines.push("\tif err != nil {", "\t\tpanic(err)", "\t}");
  hdrs.forEach(([k, v]) => lines.push(`\treq.Header.Set(${dq(k)}, ${dq(v)})`));
  lines.push("", "\tresp, err := http.DefaultClient.Do(req)", "\tif err != nil {", "\t\tpanic(err)", "\t}", "\tdefer resp.Body.Close()", "", "\trespBody, _ := io.ReadAll(resp.Body)", "\tfmt.Println(resp.StatusCode, string(respBody))", "}");
  return lines.join("\n");
}

// Java's HttpClient refuses to set these itself-managed headers
const JAVA_RESTRICTED = new Set(["host", "connection", "content-length", "expect", "upgrade"]);

export function toJava(p: ParsedCurl): string {
  const hdrs = entries(p).filter(([k]) => !JAVA_RESTRICTED.has(k.toLowerCase()));
  const publisher = p.body ? `HttpRequest.BodyPublishers.ofString(${dq(p.body)})` : "HttpRequest.BodyPublishers.noBody()";
  const lines = [
    "import java.net.URI;",
    "import java.net.http.HttpClient;",
    "import java.net.http.HttpRequest;",
    "import java.net.http.HttpResponse;",
    "",
    "public class Main {",
    "    public static void main(String[] args) throws Exception {",
    "        HttpClient client = HttpClient.newHttpClient();",
    "        HttpRequest request = HttpRequest.newBuilder()",
    `            .uri(URI.create(${dq(p.url)}))`,
    ...hdrs.map(([k, v]) => `            .header(${dq(k)}, ${dq(v)})`),
    `            .method(${dq(p.method)}, ${publisher})`,
    "            .build();",
    "",
    "        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());",
    "        System.out.println(response.statusCode() + \" \" + response.body());",
    "    }",
    "}",
  ];
  return lines.join("\n");
}

export function toCSharp(p: ParsedCurl): string {
  // Content-Type belongs to the content in .NET; setting it on the request throws
  const ct = contentType(p);
  const hdrs = entries(p).filter(([k]) => k.toLowerCase() !== "content-type");
  const method = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].includes(p.method) ? `HttpMethod.${p.method[0]}${p.method.slice(1).toLowerCase()}` : `new HttpMethod(${dq(p.method)})`;
  const lines = ["using System.Net.Http;", "using System.Text;", "", "using var client = new HttpClient();", `using var request = new HttpRequestMessage(${method}, ${dq(p.url)});`];
  hdrs.forEach(([k, v]) => lines.push(`request.Headers.TryAddWithoutValidation(${dq(k)}, ${dq(v)});`));
  if (p.body) lines.push(`request.Content = new StringContent(${dq(p.body)}, Encoding.UTF8, ${dq((ct ?? "application/x-www-form-urlencoded").split(";")[0].trim())});`);
  lines.push("", "using var response = await client.SendAsync(request);", "Console.WriteLine($\"{(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}\");");
  return lines.join("\n");
}

export function toRuby(p: ParsedCurl): string {
  const cls: Record<string, string> = { GET: "Get", POST: "Post", PUT: "Put", DELETE: "Delete", PATCH: "Patch", HEAD: "Head", OPTIONS: "Options" };
  const lines = ["require 'net/http'", "require 'uri'", "", `uri = URI(${sqBackslash(p.url)})`];
  lines.push(cls[p.method] ? `request = Net::HTTP::${cls[p.method]}.new(uri)` : `request = Net::HTTPGenericRequest.new(${sqBackslash(p.method)}, ${p.body ? "true" : "false"}, true, uri)`);
  entries(p).forEach(([k, v]) => lines.push(`request[${sqBackslash(k)}] = ${sqBackslash(v)}`));
  if (p.body) lines.push(`request.body = ${sqBackslash(p.body)}`);
  lines.push("", "response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|", "  http.request(request)", "end", "", "puts response.code, response.body");
  return lines.join("\n");
}

export function toRust(p: ParsedCurl): string {
  const lines = [
    "// Cargo.toml: reqwest = { version = \"0.12\", features = [\"blocking\"] }",
    "use reqwest::blocking::Client;",
    "use reqwest::Method;",
    "",
    "fn main() -> Result<(), Box<dyn std::error::Error>> {",
    "    let response = Client::new()",
    `        .request(Method::from_bytes(b${dqBraced(p.method)})?, ${dqBraced(p.url)})`,
    ...entries(p).map(([k, v]) => `        .header(${dqBraced(k)}, ${dqBraced(v)})`),
  ];
  if (p.body) lines.push(`        .body(${dqBraced(p.body)})`);
  lines.push("        .send()?;", "", "    println!(\"{} {}\", response.status(), response.text()?);", "    Ok(())", "}");
  return lines.join("\n");
}

export function toPowerShell(p: ParsedCurl): string {
  const hdrs = entries(p);
  const lines: string[] = [];
  if (hdrs.length) lines.push("$headers = @{", ...hdrs.map(([k, v]) => `    ${sqDouble(k)} = ${sqDouble(v)}`), "}", "");
  const args = [`-Uri ${sqDouble(p.url)}`, `-Method ${sqDouble(p.method)}`];
  if (hdrs.length) args.push("-Headers $headers");
  if (p.body) args.push(`-Body ${sqDouble(p.body)}`);
  lines.push(`$response = Invoke-RestMethod ${args.join(" `\n    ")}`, "$response");
  return lines.join("\n");
}

export function toSwift(p: ParsedCurl): string {
  const lines = ["import Foundation", "", `var request = URLRequest(url: URL(string: ${dqBraced(p.url)})!)`, `request.httpMethod = ${dqBraced(p.method)}`];
  entries(p).forEach(([k, v]) => lines.push(`request.setValue(${dqBraced(v)}, forHTTPHeaderField: ${dqBraced(k)})`));
  if (p.body) lines.push(`request.httpBody = Data(${dqBraced(p.body)}.utf8)`);
  lines.push("", "let (data, response) = try await URLSession.shared.data(for: request)", "print((response as? HTTPURLResponse)?.statusCode ?? 0, String(decoding: data, as: UTF8.self))");
  return lines.join("\n");
}

export function toWget(p: ParsedCurl): string {
  const parts = ["wget", "--quiet", "--output-document=-", `--method=${p.method}`];
  entries(p).forEach(([k, v]) => parts.push(`--header=${sh(`${k}: ${v}`)}`));
  if (p.body) parts.push(`--body-data=${sh(p.body)}`);
  parts.push(sh(p.url));
  return parts.join(" \\\n  ");
}

export interface LanguageOption {
  id: string;
  label: string;
  generator: (p: ParsedCurl) => string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: "js-fetch", label: "JavaScript (fetch)", generator: toJsFetch },
  { id: "node-axios", label: "Node.js (axios)", generator: toNodeAxios },
  { id: "python-requests", label: "Python (requests)", generator: toPythonRequests },
  { id: "python-httpx", label: "Python (httpx)", generator: toPythonHttpx },
  { id: "php-curl", label: "PHP (cURL)", generator: toPhpCurl },
  { id: "go-http", label: "Go (net/http)", generator: toGoHttp },
  { id: "java", label: "Java (HttpClient)", generator: toJava },
  { id: "csharp", label: "C# (HttpClient)", generator: toCSharp },
  { id: "ruby", label: "Ruby (Net::HTTP)", generator: toRuby },
  { id: "rust", label: "Rust (reqwest)", generator: toRust },
  { id: "powershell", label: "PowerShell", generator: toPowerShell },
  { id: "swift", label: "Swift (URLSession)", generator: toSwift },
  { id: "wget", label: "wget", generator: toWget },
];
