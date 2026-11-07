// Reads the headers APIs use to say "slow down", works out how long a client should wait, and writes
// the retry code. Retry-After is standard (RFC 9110); the rest are conventions that differ by provider.

export interface ParsedRetryAfter {
  kind: "seconds" | "date" | "invalid";
  /** How long to wait from `now`, never negative */
  seconds: number | null;
  at: Date | null;
  note?: string;
}

const HTTP_DATE = /^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/;

/** RFC 9110 allows exactly two forms: a whole number of seconds, or an HTTP date */
export function parseRetryAfter(value: string, now: number = Date.now()): ParsedRetryAfter {
  const v = value.trim();
  if (/^\d+$/.test(v)) {
    const seconds = Number(v);
    return { kind: "seconds", seconds, at: new Date(now + seconds * 1000) };
  }
  if (HTTP_DATE.test(v) && !Number.isNaN(Date.parse(v))) {
    const at = new Date(v);
    const seconds = Math.max(0, Math.ceil((at.getTime() - now) / 1000));
    return { kind: "date", seconds, at, note: at.getTime() <= now ? "That time has passed, so a client can retry now." : undefined };
  }
  const number = /^-?\d*\.?\d+$/.test(v);
  return {
    kind: "invalid",
    seconds: null,
    at: null,
    note: number ? "Retry-After must be a whole, non-negative number of seconds. Many clients will ignore this value." : `Not valid: use seconds like 120, or a date like Wed, 21 Oct 2026 07:28:00 GMT.`,
  };
}

/** A reset value in any form providers use. "1m30s", "250ms", epoch seconds or ms, ISO or HTTP dates */
export function parseResetValue(value: string, now: number = Date.now()): { seconds: number; form: string } | null {
  const v = value.trim();
  const duration = /^(?:(\d+)h)?(?:(\d+)m(?!s))?(?:(\d+(?:\.\d+)?)s)?(?:(\d+)ms)?$/.exec(v);
  if (duration && v && /[a-z]$/.test(v)) {
    const seconds = Number(duration[1] ?? 0) * 3600 + Number(duration[2] ?? 0) * 60 + Number(duration[3] ?? 0) + Number(duration[4] ?? 0) / 1000;
    return { seconds, form: "a duration" };
  }
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v);
    // Too big to be a sensible delay: it's a point in time
    if (n > 1e11) return { seconds: Math.max(0, Math.ceil((n - now) / 1000)), form: "a Unix time in milliseconds" };
    if (n > 1e8) return { seconds: Math.max(0, Math.ceil(n - now / 1000)), form: "a Unix time in seconds" };
    return { seconds: n, form: "seconds from now" };
  }
  const t = Date.parse(v);
  if (!Number.isNaN(t) && /\d{4}/.test(v)) return { seconds: Math.max(0, Math.ceil((t - now) / 1000)), form: "a date" };
  return null;
}

export interface ExplainedHeader {
  name: string;
  value: string;
  meaning: string;
  bad?: boolean;
}

export interface RateLimitReport {
  status: number | null;
  headers: ExplainedHeader[];
  limit: number | null;
  remaining: number | null;
  resetSeconds: number | null;
  /** How long a client should wait before the next request, and why */
  wait: { seconds: number; because: string } | null;
  verdict: string;
}

/** `limit=100, remaining=50, reset=30` (older draft) or `"default";r=50;t=30` (current draft) */
function parseStructured(value: string): { limit?: number; remaining?: number; reset?: number } {
  const out: { limit?: number; remaining?: number; reset?: number } = {};
  const grab = (re: RegExp) => {
    const m = re.exec(value);
    return m ? Number(m[1]) : undefined;
  };
  out.limit = grab(/\b(?:limit|q)=(\d+)/);
  out.remaining = grab(/\b(?:remaining|r)=(\d+)/);
  out.reset = grab(/\b(?:reset|t)=(\d+)/);
  return out;
}

const fmt = (seconds: number) => {
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 90) return `${Math.round(seconds * 10) / 10} seconds`;
  if (seconds < 5400) return `${Math.round(seconds / 6) / 10} minutes`;
  return `${Math.round(seconds / 360) / 10} hours`;
};

export const formatWait = fmt;

/** Takes raw response headers, as `curl -i` prints them or as copied from dev tools */
export function explainRateLimit(raw: string, now: number = Date.now()): RateLimitReport {
  let status: number | null = null;
  const headers: ExplainedHeader[] = [];
  let limit: number | null = null;
  let remaining: number | null = null;
  let resetSeconds: number | null = null;
  let retryAfter: number | null = null;
  let retryMs: number | null = null;
  let resetName = "";

  const setReset = (name: string, seconds: number) => {
    // When a provider sends several windows, the longest wait is the one that matters
    if (resetSeconds === null || seconds > resetSeconds) {
      resetSeconds = seconds;
      resetName = name;
    }
  };

  raw.split(/\r?\n/).forEach((line) => {
    const statusMatch = /^HTTP\/[\d.]+\s+(\d{3})/i.exec(line.trim());
    if (statusMatch) {
      status = Number(statusMatch[1]);
      return;
    }
    const m = /^\s*([A-Za-z0-9-]+)\s*:\s*(.+?)\s*$/.exec(line);
    if (!m) return;
    const name = m[1];
    const value = m[2];
    const key = name.toLowerCase();

    if (key === "retry-after") {
      const r = parseRetryAfter(value, now);
      if (r.kind === "invalid") headers.push({ name, value, meaning: r.note!, bad: true });
      else {
        retryAfter = r.seconds;
        headers.push({ name, value, meaning: `Wait ${fmt(r.seconds!)} before retrying${r.kind === "date" ? ` (until ${r.at!.toUTCString()})` : ""}. ${r.note ?? ""}`.trim() });
      }
      return;
    }
    if (key === "retry-after-ms" || key === "x-ms-retry-after-ms") {
      if (/^\d+$/.test(value)) {
        retryMs = Number(value) / 1000;
        headers.push({ name, value, meaning: `Wait ${fmt(retryMs)}. A millisecond form used by Azure and some SDKs, and it takes priority over Retry-After there.` });
      } else headers.push({ name, value, meaning: "Expected a whole number of milliseconds.", bad: true });
      return;
    }
    if (key === "ratelimit") {
      const s = parseStructured(value);
      if (s.limit !== undefined) limit = s.limit;
      if (s.remaining !== undefined) remaining = s.remaining;
      if (s.reset !== undefined) setReset(name, s.reset);
      const bits = [s.limit !== undefined && `limit ${s.limit}`, s.remaining !== undefined && `${s.remaining} left`, s.reset !== undefined && `resets in ${fmt(s.reset)}`].filter(Boolean);
      headers.push({ name, value, meaning: bits.length ? `IETF draft header: ${bits.join(", ")}.` : "IETF draft header, but no limit, remaining or reset values could be read.", bad: !bits.length });
      return;
    }
    if (key === "ratelimit-policy" || key === "x-ratelimit-policy") {
      const window = /\bw=(\d+)/.exec(value);
      const quota = /\bq=(\d+)/.exec(value) ?? /^(\d+)/.exec(value);
      headers.push({ name, value, meaning: `The policy${quota ? `: ${quota[1]} units` : ""}${window ? ` per ${fmt(Number(window[1]))}` : ""}. It describes the rule, not your current usage.` });
      return;
    }
    if (key === "x-ratelimit-used") {
      headers.push({ name, value, meaning: "Requests used in the current window (GitHub and others)." });
      return;
    }
    if (key === "x-ratelimit-resource") {
      headers.push({ name, value, meaning: "Which pool of limits this request counted against (GitHub)." });
      return;
    }
    if (key === "x-ratelimit-bucket") {
      headers.push({ name, value, meaning: "An id for the shared limit bucket this route belongs to (Discord)." });
      return;
    }

    // Everything else is a family with limit / remaining / reset in the name
    if (!/rate-?limit/.test(key)) return;
    const part = /(limit|remaining|reset)/.exec(key.replace(/x-rate-?limit-?|anthropic-ratelimit-?|^ratelimit-?/, ""))?.[1] ?? (/-limit$/.test(key) ? "limit" : "");
    const what = /tokens/.test(key) ? "tokens" : /requests/.test(key) ? "requests" : "requests";
    if (part === "limit") {
      if (/^\d+$/.test(value) && what === "requests") limit = Number(value);
      headers.push({ name, value, meaning: `The most ${what} allowed in the current window.` });
    } else if (part === "remaining") {
      if (/^\d+$/.test(value)) remaining = remaining === null ? Number(value) : Math.min(remaining, Number(value));
      headers.push({ name, value, meaning: `${what === "tokens" ? "Tokens" : "Requests"} left in the current window.` });
    } else if (part === "reset") {
      const r = parseResetValue(value, now);
      if (r) {
        setReset(name, r.seconds);
        headers.push({ name, value, meaning: `Read as ${r.form}: the window resets in ${fmt(r.seconds)}.` });
      } else headers.push({ name, value, meaning: "Couldn't read this as a time.", bad: true });
    } else {
      headers.push({ name, value, meaning: "A rate limit header this tool doesn't have a specific note for." });
    }
  });

  // Retry-After is the server's own instruction, so it beats anything worked out from the counters
  let wait: RateLimitReport["wait"] = null;
  const limited = status === 429 || status === 503;
  const after = retryMs ?? retryAfter;
  if (after !== null) wait = { seconds: after, because: retryMs !== null ? "the millisecond retry header" : "Retry-After, which takes priority over every other header" };
  else if (limited && resetSeconds !== null) wait = { seconds: resetSeconds, because: `${resetName}, since there's no Retry-After` };
  else if (remaining === 0 && resetSeconds !== null) wait = { seconds: resetSeconds, because: `nothing is left and ${resetName} says when the window resets` };

  let verdict: string;
  if (wait) verdict = `Wait ${fmt(wait.seconds)} before the next request.`;
  else if (limited) verdict = `This is a ${status} with no usable wait time, so use exponential backoff with jitter.`;
  else if (remaining !== null) verdict = remaining > 0 ? `No need to wait: ${remaining} left in this window.` : "Nothing left, but no reset time given. Use exponential backoff with jitter.";
  else if (headers.length) verdict = "These headers don't call for a wait.";
  else verdict = "No rate limit headers found.";

  return { status, headers, limit, remaining, resetSeconds, wait, verdict };
}

// ─── Backoff ─────────────────────────────────────────────────────────────────

export type Jitter = "full" | "equal" | "none";

export interface BackoffOptions {
  baseSeconds: number;
  factor: number;
  capSeconds: number;
  attempts: number;
  jitter: Jitter;
}

export interface BackoffStep {
  attempt: number;
  minSeconds: number;
  maxSeconds: number;
}

/** Delay range for each retry: `base × factor^n`, capped, then spread by the jitter */
export function backoffSchedule(o: BackoffOptions): BackoffStep[] {
  return Array.from({ length: Math.max(0, Math.min(20, Math.floor(o.attempts))) }, (_, i) => {
    const max = Math.min(o.capSeconds, o.baseSeconds * o.factor ** i);
    const min = o.jitter === "full" ? 0 : o.jitter === "equal" ? max / 2 : max;
    return { attempt: i + 1, minSeconds: min, maxSeconds: max };
  });
}

const jitterJs = (j: Jitter) => (j === "full" ? "Math.random() * delay" : j === "equal" ? "delay / 2 + Math.random() * (delay / 2)" : "delay");
const jitterPy = (j: Jitter) => (j === "full" ? "random.uniform(0, delay)" : j === "equal" ? "delay / 2 + random.uniform(0, delay / 2)" : "delay");

export function retryCodeJs(o: BackoffOptions): string {
  return `// Retries 429 and 503, waiting as long as Retry-After says, or backing off when it's absent.
// Only retry requests that are safe to repeat: a POST may need an idempotency key.
function retryAfterSeconds(value) {
  if (!value) return null;
  if (/^\\d+$/.test(value.trim())) return Number(value);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}

async function fetchWithRetry(url, options = {}, maxRetries = ${o.attempts}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, options);
    if ((response.status !== 429 && response.status !== 503) || attempt >= maxRetries) return response;

    const delay = Math.min(${o.capSeconds}, ${o.baseSeconds} * ${o.factor} ** attempt);
    const wait = retryAfterSeconds(response.headers.get("retry-after")) ?? ${jitterJs(o.jitter)};
    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
  }
}
`;
}

export function retryCodePython(o: BackoffOptions): string {
  return `# Retries 429 and 503, waiting as long as Retry-After says, or backing off when it's absent.
# Only retry requests that are safe to repeat: a POST may need an idempotency key.
import random
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import requests


def retry_after_seconds(value):
    if not value:
        return None
    if value.strip().isdigit():
        return int(value)
    try:
        return max(0, (parsedate_to_datetime(value) - datetime.now(timezone.utc)).total_seconds())
    except (TypeError, ValueError):
        return None


def get_with_retry(url, max_retries=${o.attempts}, **kwargs):
    for attempt in range(max_retries + 1):
        response = requests.get(url, timeout=30, **kwargs)
        if response.status_code not in (429, 503) or attempt == max_retries:
            return response

        delay = min(${o.capSeconds}, ${o.baseSeconds} * ${o.factor} ** attempt)
        wait = retry_after_seconds(response.headers.get("Retry-After"))
        time.sleep(wait if wait is not None else ${jitterPy(o.jitter)})
`;
}

export function retryCodeCurl(o: BackoffOptions, url: string): string {
  return `# curl 7.66+ honors Retry-After on its own; without it, it doubles the wait each time, up to 10 minutes.
curl --retry ${o.attempts} --retry-max-time 120 -i "${url}"`;
}

// ─── Test endpoint limits ────────────────────────────────────────────────────

export interface MockParams {
  limit: number;
  windowSeconds: number;
  status: 429 | 503;
  format: "seconds" | "date";
}

const clamp = (value: string | null, min: number, max: number, fallback: number) => {
  const n = value === null || value.trim() === "" ? NaN : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

export function readMockParams(params: URLSearchParams): MockParams {
  return {
    limit: clamp(params.get("limit"), 0, 100, 3),
    windowSeconds: clamp(params.get("window"), 1, 3600, 30),
    status: params.get("status") === "503" ? 503 : 429,
    format: params.get("format") === "date" ? "date" : "seconds",
  };
}

/** The response for request number `count` in a fixed window that started at `windowStart` (ms) */
export function mockResponse(p: MockParams, count: number, windowStart: number, now: number) {
  const resetAt = windowStart + p.windowSeconds * 1000;
  const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const allowed = count <= p.limit;
  const remaining = Math.max(0, p.limit - count);
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(p.limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
    "X-RateLimit-Limit": String(p.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
  if (!allowed) headers["Retry-After"] = p.format === "date" ? new Date(now + resetSeconds * 1000).toUTCString() : String(resetSeconds);
  return { status: allowed ? 200 : p.status, headers, allowed, remaining, resetSeconds };
}
