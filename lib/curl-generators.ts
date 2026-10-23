import type { ParsedCurl } from "./curl-parser";

function entries(p: ParsedCurl): [string, string][] {
  return Object.entries(p.headers);
}

export function toJsFetch(p: ParsedCurl): string {
  const hdrs = entries(p);
  const headerObj = hdrs.length
    ? `{\n${hdrs.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  }`
    : "{}";
  const opts = [`method: "${p.method}"`, `headers: ${headerObj}`];
  if (p.body) opts.push(`body: ${JSON.stringify(p.body)}`);
  return `fetch("${p.url}", {\n  ${opts.join(",\n  ")}\n})\n  .then((res) => res.json())\n  .then((data) => console.log(data))\n  .catch((err) => console.error(err));`;
}

export function toNodeAxios(p: ParsedCurl): string {
  const hdrs = entries(p);
  const headerObj = hdrs.length
    ? `{\n${hdrs.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  }`
    : "{}";
  const lines = [
    `const axios = require("axios");`,
    ``,
    `axios({`,
    `  method: "${p.method.toLowerCase()}",`,
    `  url: "${p.url}",`,
    `  headers: ${headerObj},`,
  ];
  if (p.body) lines.push(`  data: ${JSON.stringify(p.body)},`);
  lines.push(`})`, `  .then((res) => console.log(res.data))`, `  .catch((err) => console.error(err));`);
  return lines.join("\n");
}

export function toPythonRequests(p: ParsedCurl): string {
  const hdrs = entries(p);
  const headerDict = hdrs.length
    ? `{\n${hdrs.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n}`
    : "{}";
  const lines = ["import requests", "", `url = "${p.url}"`, `headers = ${headerDict}`];
  if (p.body) lines.push(`data = ${JSON.stringify(p.body)}`);
  lines.push(
    "",
    `response = requests.request("${p.method}", url, headers=headers${p.body ? ", data=data" : ""})`,
    "",
    "print(response.text)"
  );
  return lines.join("\n");
}

export function toPhpCurl(p: ParsedCurl): string {
  const hdrs = entries(p).map(([k, v]) => `        "${k}: ${v}",`);
  const lines = [
    "<?php",
    "",
    "$curl = curl_init();",
    "",
    "curl_setopt_array($curl, [",
    `    CURLOPT_URL => "${p.url}",`,
    "    CURLOPT_RETURNTRANSFER => true,",
    `    CURLOPT_CUSTOMREQUEST => "${p.method}",`,
  ];
  if (p.body) lines.push(`    CURLOPT_POSTFIELDS => ${JSON.stringify(p.body)},`);
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
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(p.body)})`);
    lines.push(`\treq, err := http.NewRequest("${p.method}", "${p.url}", body)`);
  } else {
    lines.push(`\treq, err := http.NewRequest("${p.method}", "${p.url}", nil)`);
  }
  lines.push("\tif err != nil {", "\t\tpanic(err)", "\t}");
  hdrs.forEach(([k, v]) => lines.push(`\treq.Header.Set("${k}", "${v}")`));
  lines.push(
    "",
    "\tclient := &http.Client{}",
    "\tresp, err := client.Do(req)",
    "\tif err != nil {",
    "\t\tpanic(err)",
    "\t}",
    "\tdefer resp.Body.Close()",
    "",
    "\trespBody, _ := io.ReadAll(resp.Body)",
    "\tfmt.Println(string(respBody))",
    "}"
  );
  return lines.join("\n");
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
  { id: "php-curl", label: "PHP (cURL)", generator: toPhpCurl },
  { id: "go-http", label: "Go (net/http)", generator: toGoHttp },
];
