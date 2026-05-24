import type { ParsedCurl } from './curl-parser'

export interface Language {
  id: string
  label: string
  sublabel: string
  color: string
  ext: string
}

export const LANGUAGES: Language[] = [
  { id: 'python',     label: 'Python',      sublabel: 'requests',   color: '#3776ab', ext: 'py' },
  { id: 'javascript', label: 'JavaScript',  sublabel: 'fetch',      color: '#f7df1e', ext: 'js' },
  { id: 'axios',      label: 'Node.js',     sublabel: 'axios',      color: '#cb3837', ext: 'js' },
  { id: 'php',        label: 'PHP',         sublabel: 'cURL',       color: '#8892be', ext: 'php' },
  { id: 'go',         label: 'Go',          sublabel: 'net/http',   color: '#00add8', ext: 'go' },
  { id: 'java',       label: 'Java',        sublabel: 'HttpClient', color: '#f89820', ext: 'java' },
  { id: 'csharp',     label: 'C#',          sublabel: 'HttpClient', color: '#9b4f96', ext: 'cs' },
  { id: 'ruby',       label: 'Ruby',        sublabel: 'net/http',   color: '#cc342d', ext: 'rb' },
]

export function generateCode(parsed: ParsedCurl, langId: string): string {
  switch (langId) {
    case 'python':     return generatePython(parsed)
    case 'javascript': return generateJavaScript(parsed)
    case 'axios':      return generateAxios(parsed)
    case 'php':        return generatePHP(parsed)
    case 'go':         return generateGo(parsed)
    case 'java':       return generateJava(parsed)
    case 'csharp':     return generateCSharp(parsed)
    case 'ruby':       return generateRuby(parsed)
    default:           return ''
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pyStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function jsStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function tryParseJson(s: string): object | null {
  try { return JSON.parse(s) } catch { return null }
}

function toPyDict(obj: object, ind = 4): string {
  const entries = Object.entries(obj)
  if (entries.length === 0) return '{}'
  const lines = entries.map(([k, v]) => `${' '.repeat(ind)}${pyStr(k)}: ${pyStr(String(v))},`)
  return `{\n${lines.join('\n')}\n}`
}

function toJsObj(obj: object, ind = 4): string {
  const entries = Object.entries(obj)
  if (entries.length === 0) return '{}'
  const lines = entries.map(([k, v]) => `${' '.repeat(ind)}${jsStr(k)}: ${jsStr(String(v))},`)
  return `{\n${lines.join('\n')}\n  }`
}

// ─── Python ───────────────────────────────────────────────────────────────────

function generatePython(p: ParsedCurl): string {
  const lines: string[] = ['import requests', '']

  if (p.insecure) {
    lines.push('import urllib3', 'urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)', '')
  }

  // Headers (exclude Content-Type — requests sets it from json= / data=)
  const headers = { ...p.headers }
  const hasHeaders = Object.keys(headers).length > 0

  if (hasHeaders) {
    lines.push('headers = ' + toPyDict(headers))
    lines.push('')
  }

  if (p.auth) {
    lines.push(`auth = (${pyStr(p.auth.username)}, ${pyStr(p.auth.password)})`)
    lines.push('')
  }

  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    lines.push('cookies = ' + toPyDict(p.cookies))
    lines.push('')
  }

  // Body
  let bodyVar = ''
  if (p.bodyType === 'json' && p.body) {
    const parsed = tryParseJson(p.body)
    if (parsed) {
      lines.push('json_data = ' + toPyDict(parsed as object))
      lines.push('')
      bodyVar = 'json'
    } else {
      lines.push(`data = ${pyStr(p.body)}`)
      lines.push('')
      bodyVar = 'data_raw'
    }
  } else if ((p.bodyType === 'form' || p.bodyType === 'multipart') && Object.keys(p.formData).length > 0) {
    const key = p.bodyType === 'multipart' ? 'files' : 'data'
    lines.push(`${key} = ` + toPyDict(p.formData))
    lines.push('')
    bodyVar = key
  } else if (p.body) {
    lines.push(`data = ${pyStr(p.body)}`)
    lines.push('')
    bodyVar = 'data_raw'
  }

  // Build the request call
  const method = p.method.toLowerCase()
  const args: string[] = [`    ${pyStr(p.url)},`]
  if (hasHeaders) args.push(`    headers=headers,`)
  if (p.auth) args.push(`    auth=auth,`)
  if (hasCookies) args.push(`    cookies=cookies,`)
  if (bodyVar === 'json') args.push(`    json=json_data,`)
  else if (bodyVar === 'data_raw') args.push(`    data=data,`)
  else if (bodyVar === 'files') args.push(`    files=files,`)
  else if (bodyVar === 'data') args.push(`    data=data,`)
  if (p.followRedirects) args.push(`    allow_redirects=True,`)
  if (p.insecure) args.push(`    verify=False,`)
  if (p.timeout !== null) args.push(`    timeout=${p.timeout},`)
  if (p.proxy) args.push(`    proxies={'http': ${pyStr(p.proxy)}, 'https': ${pyStr(p.proxy)}},`)

  lines.push(`response = requests.${method}(`)
  lines.push(args.join('\n'))
  lines.push(')')
  lines.push('')
  lines.push('print(response.status_code)')
  lines.push('print(response.json())')

  return lines.join('\n')
}

// ─── JavaScript fetch ─────────────────────────────────────────────────────────

function generateJavaScript(p: ParsedCurl): string {
  const lines: string[] = []

  const headers = { ...p.headers }
  if (p.auth) {
    const creds = btoa(`${p.auth.username}:${p.auth.password}`)
    headers['Authorization'] = `Basic ${creds}`
  }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    headers['Cookie'] = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  const opts: string[] = []
  if (p.method !== 'GET') opts.push(`  method: '${p.method}',`)

  if (Object.keys(headers).length > 0) {
    opts.push('  headers: ' + toJsObj(headers).replace(/^{\n/, '{\n').trimEnd() + ',')
  }

  // Body
  if (p.bodyType === 'json' && p.body) {
    const parsed = tryParseJson(p.body)
    if (parsed) {
      const jsonStr = JSON.stringify(parsed, null, 4)
        .split('\n')
        .map((l, i) => i === 0 ? l : '  ' + l)
        .join('\n')
      opts.push(`  body: JSON.stringify(${jsonStr}),`)
    } else {
      opts.push(`  body: ${jsStr(p.body)},`)
    }
  } else if ((p.bodyType === 'form') && Object.keys(p.formData).length > 0) {
    const params = Object.entries(p.formData).map(([k, v]) => `  ${jsStr(k)}: ${jsStr(v)},`).join('\n')
    opts.push(`  body: new URLSearchParams({\n${params}\n  }),`)
  } else if (p.bodyType === 'multipart' && Object.keys(p.formData).length > 0) {
    lines.push('const formData = new FormData()')
    Object.entries(p.formData).forEach(([k, v]) => {
      lines.push(`formData.append(${jsStr(k)}, ${jsStr(v)})`)
    })
    lines.push('')
    opts.push(`  body: formData,`)
  } else if (p.body) {
    opts.push(`  body: ${jsStr(p.body)},`)
  }

  if (!p.followRedirects) opts.push(`  redirect: 'follow',`)

  lines.push(`const response = await fetch(${jsStr(p.url)}, {`)
  lines.push(...opts)
  lines.push('})')
  lines.push('')

  if (p.timeout !== null) {
    lines.unshift(
      `const controller = new AbortController()`,
      `setTimeout(() => controller.abort(), ${p.timeout * 1000})`,
      '',
    )
    // Insert signal into opts — rebuild
    const insertIdx = lines.findIndex(l => l.includes('await fetch'))
    lines.splice(insertIdx + 1, 0, `  signal: controller.signal,`)
  }

  lines.push('const data = await response.json()')
  lines.push('console.log(data)')

  return lines.join('\n')
}

// ─── Node.js axios ────────────────────────────────────────────────────────────

function generateAxios(p: ParsedCurl): string {
  const lines: string[] = ["import axios from 'axios'", '']

  const headers = { ...p.headers }
  // Remove Content-Type — axios sets it automatically
  delete headers['Content-Type']
  const hasHeaders = Object.keys(headers).length > 0

  let bodyPart = ''
  if (p.bodyType === 'json' && p.body) {
    const parsed = tryParseJson(p.body)
    if (parsed) {
      bodyPart = '  ' + JSON.stringify(parsed, null, 2).split('\n').join('\n  ') + ','
    } else {
      bodyPart = `  ${jsStr(p.body)},`
    }
  } else if ((p.bodyType === 'form' || p.bodyType === 'multipart') && Object.keys(p.formData).length > 0) {
    const entries = Object.entries(p.formData).map(([k, v]) => `    ${jsStr(k)}: ${jsStr(v)},`).join('\n')
    bodyPart = `  {\n${entries}\n  },`
  }

  const configEntries: string[] = []
  if (hasHeaders) configEntries.push('    headers: ' + toJsObj(headers) + ',')
  if (p.auth) configEntries.push(`    auth: {\n      username: ${jsStr(p.auth.username)},\n      password: ${jsStr(p.auth.password)},\n    },`)
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    const cookieStr = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
    if (!hasHeaders) {
      configEntries.push(`    headers: {\n      'Cookie': ${jsStr(cookieStr)},\n    },`)
    }
  }
  if (p.timeout !== null) configEntries.push(`    timeout: ${p.timeout * 1000},`)
  if (p.insecure) {
    lines.unshift("import https from 'https'")
    configEntries.push(`    httpsAgent: new https.Agent({ rejectUnauthorized: false }),`)
  }
  if (p.proxy) configEntries.push(`    proxy: { host: ${jsStr(p.proxy)} },`)

  const method = p.method.toLowerCase()
  const hasBody = ['post', 'put', 'patch'].includes(method)

  const configStr = configEntries.length > 0
    ? `  {\n${configEntries.join('\n')}\n  }`
    : ''

  if (hasBody && bodyPart) {
    lines.push(`const response = await axios.${method}(`)
    lines.push(`  ${jsStr(p.url)},`)
    lines.push(bodyPart)
    if (configStr) lines.push(configStr)
    lines.push(')')
  } else if (configStr) {
    lines.push(`const response = await axios.${method}(`)
    lines.push(`  ${jsStr(p.url)},`)
    lines.push(configStr)
    lines.push(')')
  } else {
    lines.push(`const response = await axios.${method}(${jsStr(p.url)})`)
  }

  lines.push('')
  lines.push('console.log(response.data)')

  return lines.join('\n')
}

// ─── PHP cURL ─────────────────────────────────────────────────────────────────

function generatePHP(p: ParsedCurl): string {
  const lines: string[] = ['<?php', '']
  lines.push('$ch = curl_init();', '')
  lines.push(`curl_setopt($ch, CURLOPT_URL, '${p.url.replace(/'/g, "\\'")}');`)
  lines.push('curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);')

  if (p.method !== 'GET') {
    lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${p.method}');`)
  }

  if (p.followRedirects) {
    lines.push('curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);')
  }

  if (p.insecure) {
    lines.push('curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);')
    lines.push('curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);')
  }

  if (p.timeout !== null) {
    lines.push(`curl_setopt($ch, CURLOPT_TIMEOUT, ${p.timeout});`)
  }

  if (p.auth) {
    lines.push(`curl_setopt($ch, CURLOPT_USERPWD, '${p.auth.username}:${p.auth.password}');`)
  }

  if (p.proxy) {
    lines.push(`curl_setopt($ch, CURLOPT_PROXY, '${p.proxy.replace(/'/g, "\\'")}');`)
  }

  // Headers
  const allHeaders = { ...p.headers }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    const cookieStr = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
    allHeaders['Cookie'] = cookieStr
  }
  if (Object.keys(allHeaders).length > 0) {
    lines.push('')
    lines.push('curl_setopt($ch, CURLOPT_HTTPHEADER, [')
    Object.entries(allHeaders).forEach(([k, v]) => {
      lines.push(`    '${k}: ${v.replace(/'/g, "\\'")}',`)
    })
    lines.push(']);')
  }

  // Body
  if (p.body) {
    lines.push('')
    lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${p.body.replace(/'/g, "\\'")}');`)
  } else if (Object.keys(p.formData).length > 0) {
    lines.push('')
    if (p.bodyType === 'multipart') {
      lines.push('curl_setopt($ch, CURLOPT_POSTFIELDS, [')
      Object.entries(p.formData).forEach(([k, v]) => {
        lines.push(`    '${k}' => '${v.replace(/'/g, "\\'")}',`)
      })
      lines.push(']);')
    } else {
      const encoded = Object.entries(p.formData).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${encoded}');`)
    }
  }

  lines.push('')
  lines.push('$response = curl_exec($ch);')
  lines.push('$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);')
  lines.push('curl_close($ch);')
  lines.push('')
  lines.push('echo $response;')
  lines.push('?>')

  return lines.join('\n')
}

// ─── Go net/http ──────────────────────────────────────────────────────────────

function generateGo(p: ParsedCurl): string {
  const imports: string[] = ['fmt', 'io', 'net/http']
  const bodyLines: string[] = []
  const lines: string[] = []

  let bodyArg = 'nil'

  if (p.body) {
    imports.push('strings')
    const escaped = p.body.replace(/`/g, '` + "`" + `')
    bodyLines.push(`body := strings.NewReader(\`${escaped}\`)`)
    bodyArg = 'body'
  } else if (Object.keys(p.formData).length > 0) {
    if (p.bodyType === 'form') {
      imports.push('net/url', 'strings')
      bodyLines.push('params := url.Values{}')
      Object.entries(p.formData).forEach(([k, v]) => {
        bodyLines.push(`params.Set("${k}", "${v.replace(/"/g, '\\"')}")`)
      })
      bodyLines.push('body := strings.NewReader(params.Encode())')
      bodyArg = 'body'
    } else {
      imports.push('bytes', 'mime/multipart')
      bodyLines.push('var buf bytes.Buffer')
      bodyLines.push('writer := multipart.NewWriter(&buf)')
      Object.entries(p.formData).forEach(([k, v]) => {
        bodyLines.push(`writer.WriteField("${k}", "${v.replace(/"/g, '\\"')}")`)
      })
      bodyLines.push('writer.Close()')
      bodyArg = '&buf'
    }
  }

  const needsInsecure = p.insecure
  if (needsInsecure) {
    imports.push('crypto/tls')
  }
  if (p.timeout !== null) {
    imports.push('time')
  }

  // Deduplicate and sort imports
  const stdImports = Array.from(new Set(imports)).sort()

  lines.push('package main')
  lines.push('')
  lines.push('import (')
  stdImports.forEach(imp => lines.push(`\t"${imp}"`))
  lines.push(')')
  lines.push('')
  lines.push('func main() {')

  if (bodyLines.length > 0) {
    bodyLines.forEach(l => lines.push('\t' + l))
    lines.push('')
  }

  lines.push(`\treq, err := http.NewRequest("${p.method}", "${p.url.replace(/"/g, '\\"')}", ${bodyArg})`)
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('')

  // Headers
  const allHeaders = { ...p.headers }
  if (p.auth) {
    const creds = Buffer.from(`${p.auth.username}:${p.auth.password}`).toString('base64')
    allHeaders['Authorization'] = `Basic ${creds}`
  }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    allHeaders['Cookie'] = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  }
  if (p.bodyType === 'multipart' && Object.keys(p.formData).length > 0) {
    allHeaders['Content-Type'] = 'multipart/form-data'
  }

  Object.entries(allHeaders).forEach(([k, v]) => {
    lines.push(`\treq.Header.Set("${k}", "${v.replace(/"/g, '\\"')}")`)
  })
  if (Object.keys(allHeaders).length > 0) lines.push('')

  // Client
  const clientParts: string[] = []
  if (p.timeout !== null) clientParts.push(`\t\tTimeout: ${p.timeout} * time.Second,`)
  if (needsInsecure) {
    lines.push('\ttr := &http.Transport{')
    lines.push('\t\tTLSClientConfig: &tls.Config{InsecureSkipVerify: true},')
    lines.push('\t}')
    clientParts.push('\t\tTransport: tr,')
  }

  if (clientParts.length > 0) {
    lines.push('\tclient := &http.Client{')
    clientParts.forEach(l => lines.push(l))
    lines.push('\t}')
  } else {
    lines.push('\tclient := &http.Client{}')
  }

  lines.push('\tresp, err := client.Do(req)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('\tdefer resp.Body.Close()')
  lines.push('')
  lines.push('\tbodyBytes, _ := io.ReadAll(resp.Body)')
  lines.push('\tfmt.Println(string(bodyBytes))')
  lines.push('}')

  return lines.join('\n')
}

// ─── Java HttpClient ──────────────────────────────────────────────────────────

function generateJava(p: ParsedCurl): string {
  const lines: string[] = []

  lines.push('import java.net.http.*;')
  lines.push('import java.net.URI;')

  if (p.insecure) {
    lines.push('import javax.net.ssl.*;')
    lines.push('import java.security.*;')
  }

  lines.push('')
  lines.push('public class Main {')
  lines.push('    public static void main(String[] args) throws Exception {')

  if (p.insecure) {
    lines.push('        // Disable SSL verification (insecure)')
    lines.push('        SSLContext sslContext = SSLContext.getInstance("TLS");')
    lines.push('        sslContext.init(null, new TrustManager[]{new X509TrustManager() {')
    lines.push('            public void checkClientTrusted(java.security.cert.X509Certificate[] c, String a) {}')
    lines.push('            public void checkServerTrusted(java.security.cert.X509Certificate[] c, String a) {}')
    lines.push('            public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }')
    lines.push('        }}, null);')
    lines.push('')
  }

  lines.push('        var client = HttpClient.newBuilder()')
  if (p.followRedirects) lines.push('            .followRedirects(HttpClient.Redirect.NORMAL)')
  if (p.insecure) lines.push('            .sslContext(sslContext)')
  lines.push('            .build();')
  lines.push('')

  // Body
  let bodyPublisher = 'HttpRequest.BodyPublishers.noBody()'
  if (p.body) {
    const escaped = p.body.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    bodyPublisher = `HttpRequest.BodyPublishers.ofString("${escaped}")`
  } else if (Object.keys(p.formData).length > 0) {
    const encoded = Object.entries(p.formData).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    bodyPublisher = `HttpRequest.BodyPublishers.ofString("${encoded}")`
  }

  const allHeaders = { ...p.headers }
  if (p.auth) {
    const creds = Buffer.from(`${p.auth.username}:${p.auth.password}`).toString('base64')
    allHeaders['Authorization'] = `Basic ${creds}`
  }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    allHeaders['Cookie'] = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  lines.push('        var request = HttpRequest.newBuilder()')
  lines.push(`            .uri(URI.create("${p.url.replace(/"/g, '\\"')}"))`)
  Object.entries(allHeaders).forEach(([k, v]) => {
    lines.push(`            .header("${k}", "${v.replace(/"/g, '\\"')}")`)
  })
  if (p.timeout !== null) {
    lines.push(`            .timeout(java.time.Duration.ofSeconds(${Math.round(p.timeout)}))`)
  }

  const method = p.method
  if (method === 'GET') {
    lines.push('            .GET()')
  } else if (method === 'POST') {
    lines.push(`            .POST(${bodyPublisher})`)
  } else if (method === 'PUT') {
    lines.push(`            .PUT(${bodyPublisher})`)
  } else if (method === 'DELETE') {
    lines.push('            .DELETE()')
  } else {
    lines.push(`            .method("${method}", ${bodyPublisher})`)
  }

  lines.push('            .build();')
  lines.push('')
  lines.push('        var response = client.send(request, HttpResponse.BodyHandlers.ofString());')
  lines.push('        System.out.println(response.statusCode());')
  lines.push('        System.out.println(response.body());')
  lines.push('    }')
  lines.push('}')

  return lines.join('\n')
}

// ─── C# HttpClient ────────────────────────────────────────────────────────────

function generateCSharp(p: ParsedCurl): string {
  const lines: string[] = []
  lines.push('using System.Net.Http;')
  lines.push('using System.Text;')
  if (p.insecure) lines.push('using System.Net.Security;')
  lines.push('')

  if (p.insecure) {
    lines.push('var handler = new HttpClientHandler();')
    lines.push('handler.ServerCertificateCustomValidationCallback = (m, c, ch, e) => true;')
    lines.push('var client = new HttpClient(handler);')
  } else {
    lines.push('var client = new HttpClient();')
  }

  if (p.timeout !== null) {
    lines.push(`client.Timeout = TimeSpan.FromSeconds(${p.timeout});`)
  }

  const allHeaders = { ...p.headers }
  if (p.auth) {
    const creds = Buffer.from(`${p.auth.username}:${p.auth.password}`).toString('base64')
    allHeaders['Authorization'] = `Basic ${creds}`
  }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    allHeaders['Cookie'] = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  // Default headers (except Content-Type — set on content)
  const defaultHeaders = Object.entries(allHeaders).filter(([k]) => k.toLowerCase() !== 'content-type')
  defaultHeaders.forEach(([k, v]) => {
    lines.push(`client.DefaultRequestHeaders.Add("${k}", "${v.replace(/"/g, '\\"')}");`)
  })

  lines.push('')

  const method = p.method

  if (p.body) {
    const ct = p.headers['Content-Type'] ?? 'application/json'
    const escaped = p.body.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    lines.push(`var content = new StringContent(`)
    lines.push(`    "${escaped}",`)
    lines.push(`    Encoding.UTF8,`)
    lines.push(`    "${ct}"`)
    lines.push(');')
    lines.push('')
  } else if (Object.keys(p.formData).length > 0 && p.bodyType === 'multipart') {
    lines.push('var content = new MultipartFormDataContent();')
    Object.entries(p.formData).forEach(([k, v]) => {
      lines.push(`content.Add(new StringContent("${v.replace(/"/g, '\\"')}"), "${k}");`)
    })
    lines.push('')
  } else if (Object.keys(p.formData).length > 0) {
    lines.push('var content = new FormUrlEncodedContent(new Dictionary<string, string>')
    lines.push('{')
    Object.entries(p.formData).forEach(([k, v]) => {
      lines.push(`    { "${k}", "${v.replace(/"/g, '\\"')}" },`)
    })
    lines.push('});')
    lines.push('')
  }

  const hasContent = p.body || Object.keys(p.formData).length > 0

  if (method === 'GET') {
    lines.push(`var response = await client.GetAsync("${p.url.replace(/"/g, '\\"')}");`)
  } else if (method === 'POST') {
    lines.push(`var response = await client.PostAsync("${p.url.replace(/"/g, '\\"')}", ${hasContent ? 'content' : 'null'});`)
  } else if (method === 'PUT') {
    lines.push(`var response = await client.PutAsync("${p.url.replace(/"/g, '\\"')}", ${hasContent ? 'content' : 'null'});`)
  } else if (method === 'DELETE') {
    lines.push(`var response = await client.DeleteAsync("${p.url.replace(/"/g, '\\"')}");`)
  } else if (method === 'PATCH') {
    lines.push(`var response = await client.PatchAsync("${p.url.replace(/"/g, '\\"')}", ${hasContent ? 'content' : 'null'});`)
  } else {
    lines.push(`var response = await client.SendAsync(new HttpRequestMessage(`)
    lines.push(`    new HttpMethod("${method}"),`)
    lines.push(`    "${p.url.replace(/"/g, '\\"')}"`)
    lines.push(') { Content = content });')
  }

  lines.push('var responseBody = await response.Content.ReadAsStringAsync();')
  lines.push('Console.WriteLine((int)response.StatusCode);')
  lines.push('Console.WriteLine(responseBody);')

  return lines.join('\n')
}

// ─── Ruby net/http ────────────────────────────────────────────────────────────

function generateRuby(p: ParsedCurl): string {
  const lines: string[] = []
  lines.push("require 'net/http'")
  lines.push("require 'uri'")

  const hasJson = p.bodyType === 'json'
  if (hasJson) lines.push("require 'json'")

  lines.push('')
  lines.push(`uri = URI.parse('${p.url.replace(/'/g, "\\'")}')`)
  lines.push(`http = Net::HTTP.new(uri.host, uri.port)`)
  lines.push('http.use_ssl = uri.scheme == \'https\'')

  if (p.insecure) {
    lines.push("http.verify_mode = OpenSSL::SSL::VERIFY_NONE")
  }

  if (p.timeout !== null) {
    lines.push(`http.read_timeout = ${p.timeout}`)
    lines.push(`http.open_timeout = ${p.timeout}`)
  }

  lines.push('')

  // Choose request class
  const methodClass: Record<string, string> = {
    GET: 'Get', POST: 'Post', PUT: 'Put', DELETE: 'Delete',
    PATCH: 'Patch', HEAD: 'Head', OPTIONS: 'Options',
  }
  const rubyMethod = methodClass[p.method] ?? 'Get'
  lines.push(`request = Net::HTTP::${rubyMethod}.new(uri.request_uri)`)

  // Headers
  const allHeaders = { ...p.headers }
  const hasCookies = Object.keys(p.cookies).length > 0
  if (hasCookies) {
    allHeaders['Cookie'] = Object.entries(p.cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  }
  Object.entries(allHeaders).forEach(([k, v]) => {
    lines.push(`request['${k}'] = '${v.replace(/'/g, "\\'")}'`)
  })

  if (p.auth) {
    lines.push(`request.basic_auth('${p.auth.username}', '${p.auth.password}')`)
  }

  // Body
  if (p.body && hasJson) {
    const parsed = tryParseJson(p.body)
    if (parsed) {
      lines.push(`request.body = ${JSON.stringify(parsed)}.to_json`)
    } else {
      lines.push(`request.body = '${p.body.replace(/'/g, "\\'")}'`)
    }
  } else if (p.body) {
    lines.push(`request.body = '${p.body.replace(/'/g, "\\'")}'`)
  } else if (Object.keys(p.formData).length > 0) {
    const formStr = Object.entries(p.formData).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    lines.push(`request.body = '${formStr}'`)
  }

  lines.push('')
  lines.push('response = http.request(request)')
  lines.push('puts response.code')
  lines.push('puts response.body')

  return lines.join('\n')
}

// Helper: btoa for Node/browser-compatible base64
function btoa(str: string): string {
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(str)
  return Buffer.from(str).toString('base64')
}
