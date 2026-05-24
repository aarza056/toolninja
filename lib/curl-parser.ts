export interface ParsedCurl {
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  bodyType: 'json' | 'form' | 'multipart' | 'raw' | null
  formData: Record<string, string>
  auth: { username: string; password: string } | null
  cookies: Record<string, string>
  followRedirects: boolean
  insecure: boolean
  timeout: number | null
  proxy: string | null
  compressed: boolean
  notes: string[]
  flagCount: number
}

export function parseCurl(command: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {},
    body: null,
    bodyType: null,
    formData: {},
    auth: null,
    cookies: {},
    followRedirects: false,
    insecure: false,
    timeout: null,
    proxy: null,
    compressed: false,
    notes: [],
    flagCount: 0,
  }

  if (!command.trim()) return result

  // Normalize: join multi-line backslash continuations, strip leading 'curl'
  const normalized = command
    .replace(/\\\s*\n\s*/g, ' ')
    .replace(/\\\s*\r\n\s*/g, ' ')
    .replace(/^curl\s+/i, '')
    .trim()

  const tokens = tokenize(normalized)
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]

    // URL — first non-flag token
    if (!token.startsWith('-') && !result.url) {
      result.url = stripQuotes(token)
      i++
      continue
    }

    // Method: -X POST or --request POST or -XPOST
    if (token === '-X' || token === '--request') {
      const next = tokens[++i]
      if (next) result.method = next.toUpperCase()
      result.flagCount++
      i++
      continue
    }
    if (/^-X.+/.test(token)) {
      result.method = token.slice(2).toUpperCase()
      result.flagCount++
      i++
      continue
    }

    // Headers: -H "Key: Value" or --header "Key: Value"
    if (token === '-H' || token === '--header') {
      const h = stripQuotes(tokens[++i] ?? '')
      const ci = h.indexOf(':')
      if (ci > -1) {
        const k = h.slice(0, ci).trim()
        const v = h.slice(ci + 1).trim()
        if (k.toLowerCase() === 'cookie') {
          parseCookieString(v, result.cookies)
        } else {
          result.headers[k] = v
          const lk = k.toLowerCase()
          if (lk === 'content-type') {
            if (v.includes('application/json')) result.bodyType = 'json'
            else if (v.includes('multipart/form-data')) result.bodyType = 'multipart'
            else if (v.includes('application/x-www-form-urlencoded')) result.bodyType = 'form'
          }
        }
      }
      result.flagCount++
      i++
      continue
    }

    // Body: -d / --data / --data-raw / --data-ascii / --data-binary
    if (['-d', '--data', '--data-raw', '--data-ascii', '--data-binary'].includes(token)) {
      result.body = stripQuotes(tokens[++i] ?? '')
      if (result.method === 'GET') result.method = 'POST'
      if (!result.bodyType) {
        try {
          JSON.parse(result.body)
          result.bodyType = 'json'
        } catch {
          result.bodyType = result.body.includes('=') ? 'form' : 'raw'
        }
      }
      result.flagCount++
      i++
      continue
    }

    // Multipart form: -F "key=value" or --form "key=value"
    if (token === '-F' || token === '--form') {
      const val = stripQuotes(tokens[++i] ?? '')
      const ei = val.indexOf('=')
      if (ei > -1) result.formData[val.slice(0, ei)] = val.slice(ei + 1)
      if (result.method === 'GET') result.method = 'POST'
      result.bodyType = 'multipart'
      result.flagCount++
      i++
      continue
    }

    // URL-encoded: --data-urlencode "key=value"
    if (token === '--data-urlencode') {
      const val = stripQuotes(tokens[++i] ?? '')
      const ei = val.indexOf('=')
      if (ei > -1) result.formData[val.slice(0, ei)] = val.slice(ei + 1)
      if (result.method === 'GET') result.method = 'POST'
      result.bodyType = 'form'
      result.flagCount++
      i++
      continue
    }

    // Basic auth: -u user:pass or --user user:pass
    if (token === '-u' || token === '--user') {
      const auth = stripQuotes(tokens[++i] ?? '')
      const ci = auth.indexOf(':')
      if (ci > -1) {
        result.auth = { username: auth.slice(0, ci), password: auth.slice(ci + 1) }
      }
      result.flagCount++
      i++
      continue
    }

    // Cookies: -b "key=val; key2=val2" or --cookie
    if (token === '-b' || token === '--cookie') {
      parseCookieString(stripQuotes(tokens[++i] ?? ''), result.cookies)
      result.flagCount++
      i++
      continue
    }

    // Follow redirects
    if (token === '-L' || token === '--location') {
      result.followRedirects = true
      result.flagCount++
      i++
      continue
    }

    // Insecure / skip SSL
    if (token === '-k' || token === '--insecure') {
      result.insecure = true
      result.notes.push('SSL verification disabled (--insecure) — included in output')
      result.flagCount++
      i++
      continue
    }

    // Timeout
    if (token === '--max-time' || token === '-m') {
      const t = parseFloat(tokens[++i] ?? '0')
      result.timeout = isNaN(t) ? null : t
      result.flagCount++
      i++
      continue
    }

    // Proxy
    if (token === '-x' || token === '--proxy') {
      result.proxy = stripQuotes(tokens[++i] ?? '')
      result.notes.push(`Proxy set to ${result.proxy} — included in output`)
      result.flagCount++
      i++
      continue
    }

    // Compressed
    if (token === '--compressed') {
      result.compressed = true
      result.flagCount++
      i++
      continue
    }

    // HEAD method
    if (token === '-I' || token === '--head') {
      result.method = 'HEAD'
      result.flagCount++
      i++
      continue
    }

    // User-Agent
    if (token === '-A' || token === '--user-agent') {
      result.headers['User-Agent'] = stripQuotes(tokens[++i] ?? '')
      result.flagCount++
      i++
      continue
    }

    // Referer
    if (token === '-e' || token === '--referer' || token === '--referer') {
      result.headers['Referer'] = stripQuotes(tokens[++i] ?? '')
      result.flagCount++
      i++
      continue
    }

    // Ignored flags (verbose, silent, include, http version)
    if (['-v', '--verbose', '-s', '--silent', '-i', '--include',
      '--http1.1', '--http2', '--http3', '-#', '--progress-bar',
      '--no-buffer', '-N', '-S', '--show-error', '-f', '--fail',
      '-o', '--output', '-O', '--remote-name',
    ].includes(token)) {
      // Skip flags that take an argument
      if (['-o', '--output'].includes(token)) i++
      i++
      continue
    }

    i++
  }

  return result
}

function parseCookieString(str: string, target: Record<string, string>) {
  str.split(';').forEach((part) => {
    const ci = part.indexOf('=')
    if (ci > -1) {
      target[part.slice(0, ci).trim()] = part.slice(ci + 1).trim()
    }
  })
}

function stripQuotes(s: string): string {
  return s.replace(/^(['"])(.*)\1$/, '$2')
}

function tokenize(str: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === "'" && !inDouble) {
      inSingle = !inSingle
    } else if (char === '"' && !inSingle) {
      inDouble = !inDouble
    } else if (char === ' ' && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }
  if (current) tokens.push(current)
  return tokens
}
