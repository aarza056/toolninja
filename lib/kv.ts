import { Redis } from "@upstash/redis";

// Small key-value layer over Upstash Redis (connected through the Vercel integration, which sets
// KV_REST_API_URL / KV_REST_API_TOKEN). Without those — local dev before setup — it falls back to an
// in-memory store so everything still works, just without persistence.

export interface Batch {
  incr(key: string): Batch;
  incrby(key: string, by: number): Batch;
  expire(key: string, seconds: number): Batch;
  hincrby(key: string, field: string, by: number): Batch;
  hset(key: string, values: Record<string, string | number>): Batch;
  lpush(key: string, ...values: string[]): Batch;
  ltrim(key: string, start: number, stop: number): Batch;
  zadd(key: string, score: number, member: string): Batch;
  zrem(key: string, member: string): Batch;
  set(key: string, value: string, opts?: { ex?: number }): Batch;
  del(key: string): Batch;
  get(key: string): Batch;
  hgetall(key: string): Batch;
  exec(): Promise<unknown[]>;
}

export interface Store {
  readonly persistent: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, string> | null>;
  hset(key: string, values: Record<string, string | number>): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  zcard(key: string): Promise<number>;
  batch(): Batch;
}

// ─── Upstash ────────────────────────────────────────────────────────────────

const str = (v: unknown) => (v === null || v === undefined ? null : typeof v === "string" ? v : JSON.stringify(v));
// With automatic deserialization off, Upstash returns HGETALL as a flat [field, value, ...] array
const strRecord = (v: unknown): Record<string, string> | null => {
  if (!v || typeof v !== "object") return null;
  const entries: [unknown, unknown][] = Array.isArray(v)
    ? Array.from({ length: Math.floor(v.length / 2) }, (_, i) => [v[i * 2], v[i * 2 + 1]])
    : Object.entries(v);
  const out: Record<string, string> = {};
  for (const [k, val] of entries) out[String(k)] = typeof val === "string" ? val : String(val);
  return Object.keys(out).length ? out : null;
};

function upstashStore(redis: Redis): Store {
  return {
    persistent: true,
    async get(key) {
      return str(await redis.get(key));
    },
    async set(key, value, opts) {
      const r = opts?.nx
        ? await redis.set(key, value, opts.ex ? { ex: opts.ex, nx: true } : { nx: true })
        : await redis.set(key, value, opts?.ex ? { ex: opts.ex } : undefined);
      return r === "OK";
    },
    async del(key) {
      await redis.del(key);
    },
    incr: (key) => redis.incr(key),
    async expire(key, seconds) {
      await redis.expire(key, seconds);
    },
    async hgetall(key) {
      return strRecord(await redis.hgetall(key));
    },
    async hset(key, values) {
      await redis.hset(key, values);
    },
    async lrange(key, start, stop) {
      return ((await redis.lrange(key, start, stop)) as unknown[]).map((v) => str(v) ?? "");
    },
    async zrevrange(key, start, stop) {
      return ((await redis.zrange(key, start, stop, { rev: true })) as unknown[]).map((v) => str(v) ?? "");
    },
    zcard: (key) => redis.zcard(key),
    batch() {
      const p = redis.pipeline();
      const hashAt = new Set<number>(); // positions whose result is an HGETALL
      const b: Batch = {
        incr: (k) => (p.incr(k), b),
        incrby: (k, n) => (p.incrby(k, n), b),
        expire: (k, s) => (p.expire(k, s), b),
        hincrby: (k, f, n) => (p.hincrby(k, f, n), b),
        hset: (k, v) => (p.hset(k, v), b),
        lpush: (k, ...v) => (p.lpush(k, ...v), b),
        ltrim: (k, s, e) => (p.ltrim(k, s, e), b),
        zadd: (k, score, member) => (p.zadd(k, { score, member }), b),
        zrem: (k, m) => (p.zrem(k, m), b),
        set: (k, v, o) => (o?.ex ? p.set(k, v, { ex: o.ex }) : p.set(k, v), b),
        del: (k) => (p.del(k), b),
        get: (k) => (p.get(k), b),
        hgetall: (k) => (hashAt.add(p.length()), p.hgetall(k), b),
        exec: async () => {
          if (p.length() === 0) return [];
          const res = (await p.exec()) as unknown[];
          return res.map((r, i) => (hashAt.has(i) ? strRecord(r) : str(r)));
        },
      };
      return b;
    },
  };
}

// ─── In-memory fallback ─────────────────────────────────────────────────────

type MemValue = string | Map<string, string> | string[] | Map<string, number>;

function memoryStore(): Store {
  const g = globalThis as unknown as { __tnMem?: { data: Map<string, MemValue>; exp: Map<string, number> } };
  g.__tnMem ??= { data: new Map(), exp: new Map() };
  const { data, exp } = g.__tnMem;

  const alive = (k: string) => {
    const e = exp.get(k);
    if (e !== undefined && e <= Date.now()) {
      data.delete(k);
      exp.delete(k);
    }
    return data.get(k);
  };
  const hash = (k: string) => {
    let h = alive(k);
    if (!(h instanceof Map)) data.set(k, (h = new Map<string, string>()));
    return h as Map<string, string>;
  };
  const list = (k: string) => {
    let l = alive(k);
    if (!Array.isArray(l)) data.set(k, (l = []));
    return l;
  };
  const zset = (k: string) => {
    let z = alive(k);
    if (!(z instanceof Map)) data.set(k, (z = new Map<string, number>()));
    return z as unknown as Map<string, number>;
  };
  const range = <T,>(arr: T[], start: number, stop: number) => arr.slice(start, stop < 0 ? arr.length + stop + 1 : stop + 1);

  const ops = {
    get: (k: string) => {
      const v = alive(k);
      return typeof v === "string" ? v : null;
    },
    set: (k: string, v: string, o?: { ex?: number; nx?: boolean }) => {
      if (o?.nx && alive(k) !== undefined) return false;
      data.set(k, v);
      if (o?.ex) exp.set(k, Date.now() + o.ex * 1000);
      else exp.delete(k);
      return true;
    },
    del: (k: string) => {
      data.delete(k);
      exp.delete(k);
    },
    incrby: (k: string, n: number) => {
      const v = Number(ops.get(k) ?? 0) + n;
      data.set(k, String(v));
      return v;
    },
    expire: (k: string, s: number) => {
      if (data.has(k)) exp.set(k, Date.now() + s * 1000);
    },
    hgetall: (k: string) => {
      const h = alive(k);
      if (!(h instanceof Map) || !h.size) return null;
      const out: Record<string, string> = {};
      (h as Map<string, string | number>).forEach((v, f) => (out[f] = String(v)));
      return out;
    },
    hincrby: (k: string, f: string, n: number) => {
      const h = hash(k);
      const v = Number(h.get(f) ?? 0) + n;
      h.set(f, String(v));
      return v;
    },
    hset: (k: string, vals: Record<string, string | number>) => {
      const h = hash(k);
      for (const [f, v] of Object.entries(vals)) h.set(f, String(v));
    },
    lpush: (k: string, ...vals: string[]) => list(k).unshift(...vals.reverse()),
    ltrim: (k: string, s: number, e: number) => {
      data.set(k, range(list(k), s, e));
    },
    zadd: (k: string, score: number, m: string) => {
      zset(k).set(m, score);
    },
    zrem: (k: string, m: string) => {
      zset(k).delete(m);
    },
    zrevrange: (k: string, s: number, e: number) =>
      range(
        Array.from(zset(k).entries())
          .sort((a, b) => b[1] - a[1])
          .map(([m]) => m),
        s,
        e
      ),
  };

  return {
    persistent: false,
    get: async (k) => ops.get(k),
    set: async (k, v, o) => ops.set(k, v, o),
    del: async (k) => ops.del(k),
    incr: async (k) => ops.incrby(k, 1),
    expire: async (k, s) => ops.expire(k, s),
    hgetall: async (k) => ops.hgetall(k),
    hset: async (k, v) => ops.hset(k, v),
    lrange: async (k, s, e) => range(list(k), s, e),
    zrevrange: async (k, s, e) => ops.zrevrange(k, s, e),
    zcard: async (k) => zset(k).size,
    batch() {
      const queue: (() => unknown)[] = [];
      const b: Batch = {
        incr: (k) => (queue.push(() => ops.incrby(k, 1)), b),
        incrby: (k, n) => (queue.push(() => ops.incrby(k, n)), b),
        expire: (k, s) => (queue.push(() => ops.expire(k, s)), b),
        hincrby: (k, f, n) => (queue.push(() => ops.hincrby(k, f, n)), b),
        hset: (k, v) => (queue.push(() => ops.hset(k, v)), b),
        lpush: (k, ...v) => (queue.push(() => ops.lpush(k, ...v)), b),
        ltrim: (k, s, e) => (queue.push(() => ops.ltrim(k, s, e)), b),
        zadd: (k, s, m) => (queue.push(() => ops.zadd(k, s, m)), b),
        zrem: (k, m) => (queue.push(() => ops.zrem(k, m)), b),
        set: (k, v, o) => (queue.push(() => ops.set(k, v, o)), b),
        del: (k) => (queue.push(() => ops.del(k)), b),
        get: (k) => (queue.push(() => ops.get(k)), b),
        hgetall: (k) => (queue.push(() => ops.hgetall(k)), b),
        exec: async () => queue.map((fn) => fn()),
      };
      return b;
    },
  };
}

// ─── Selection ──────────────────────────────────────────────────────────────

let store: Store | null = null;

export function kv(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    // cache: "default" rather than the client's own "no-store": during static rendering Next.js treats a
    // no-store fetch as "this page must be dynamic" and throws. Upstash sends every command as a POST,
    // which Next never caches anyway ("auto no cache"), so reads stay fresh and pages can still be
    // pre-rendered with real data (banner, feature switches, ratings).
    store = upstashStore(new Redis({ url, token, automaticDeserialization: false, cache: "default" }));
  } else {
    if (process.env.VERCEL_ENV === "production") console.warn("kv: KV_REST_API_URL/TOKEN missing — using in-memory store");
    store = memoryStore();
  }
  return store;
}

/** Next.js control-flow errors (dynamic-usage bailout, redirect, notFound…) carry a `digest`. */
function isNextInternalError(e: unknown): boolean {
  return typeof e === "object" && e !== null && typeof (e as { digest?: unknown }).digest === "string";
}

/**
 * Runs a storage call and returns `fallback` if storage is unreachable, so the site never breaks on it.
 * Next.js's own control-flow errors are re-thrown: swallowing one once hid a build-time bug where
 * every pre-rendered page silently got empty data.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (isNextInternalError(e)) throw e;
    console.error("kv:", e instanceof Error ? e.message : "error");
    return fallback;
  }
}

export const today = (d = new Date()) => d.toISOString().slice(0, 10);
export const DAY = 86400;
