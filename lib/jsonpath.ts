// A pragmatic JSONPath subset: $, ., [], ['name'], [index], [*], [i,j,...], [start:end:step], and
// .. recursive descent. Filter expressions ([?(@.price<10)]) and script expressions are not
// supported — they require evaluating arbitrary predicate code, which is out of scope here.

export interface JsonPathMatch {
  path: string;
  value: unknown;
}

type Token =
  | { type: "root" }
  | { type: "member"; name: string }
  | { type: "index"; index: number }
  | { type: "wildcard" }
  | { type: "slice"; start?: number; end?: number; step?: number }
  | { type: "union"; values: (string | number)[] }
  | { type: "recursive" };

function parseBracketContent(content: string): Token[] {
  const trimmed = content.trim();

  if (trimmed === "*") return [{ type: "wildcard" }];

  if (trimmed.startsWith("?")) {
    throw new Error("Filter expressions like [?(@.price<10)] aren't supported — use a plain index, name, wildcard, or slice.");
  }

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map((p) => p.trim());
    if (parts.length > 3) throw new Error(`Invalid slice syntax: [${trimmed}]`);
    const parse = (p: string) => (p === "" ? undefined : Number(p));
    const [start, end, step] = parts.map(parse);
    if ([start, end, step].some((n) => n !== undefined && Number.isNaN(n))) {
      throw new Error(`Invalid slice syntax: [${trimmed}]`);
    }
    return [{ type: "slice", start, end, step }];
  }

  if (trimmed.includes(",")) {
    const values = trimmed.split(",").map((part) => {
      const p = part.trim();
      if ((p.startsWith("'") && p.endsWith("'")) || (p.startsWith('"') && p.endsWith('"'))) {
        return p.slice(1, -1);
      }
      const n = Number(p);
      if (Number.isNaN(n)) throw new Error(`Invalid value in union selector: "${p}"`);
      return n;
    });
    return [{ type: "union", values }];
  }

  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return [{ type: "member", name: trimmed.slice(1, -1) }];
  }

  const n = Number(trimmed);
  if (Number.isNaN(n)) throw new Error(`Invalid bracket expression: [${trimmed}]`);
  return [{ type: "index", index: n }];
}

export function parseJsonPath(path: string): Token[] {
  const trimmed = path.trim();
  if (!trimmed) throw new Error("Expression is empty.");

  const tokens: Token[] = [];
  let i = 0;

  if (trimmed[0] === "$") {
    tokens.push({ type: "root" });
    i = 1;
  }

  while (i < trimmed.length) {
    const ch = trimmed[i];

    if (ch === ".") {
      if (trimmed[i + 1] === ".") {
        tokens.push({ type: "recursive" });
        i += 2;
        continue;
      }
      i += 1;
      if (trimmed[i] === "*") {
        tokens.push({ type: "wildcard" });
        i += 1;
        continue;
      }
      const start = i;
      while (i < trimmed.length && /[A-Za-z0-9_$-]/.test(trimmed[i])) i++;
      if (i === start) throw new Error(`Expected a property name after "." at position ${start}.`);
      tokens.push({ type: "member", name: trimmed.slice(start, i) });
      continue;
    }

    if (ch === "[") {
      const end = trimmed.indexOf("]", i);
      if (end === -1) throw new Error(`Unclosed "[" at position ${i}.`);
      const content = trimmed.slice(i + 1, end);
      tokens.push(...parseBracketContent(content));
      i = end + 1;
      continue;
    }

    throw new Error(`Unexpected character "${ch}" at position ${i}. Did you forget a "." before a property name?`);
  }

  return tokens;
}

function resolveSlice(len: number, t: { start?: number; end?: number; step?: number }): number[] {
  const step = t.step ?? 1;
  if (step <= 0) throw new Error("Only positive slice steps are supported.");
  let s = t.start ?? 0;
  let e = t.end ?? len;
  if (s < 0) s = Math.max(len + s, 0);
  if (e < 0) e = Math.max(len + e, 0);
  s = Math.min(s, len);
  e = Math.min(e, len);
  const indices: number[] = [];
  for (let idx = s; idx < e; idx += step) indices.push(idx);
  return indices;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function evalFrom(tokens: Token[], idx: number, node: unknown, path: string): JsonPathMatch[] {
  if (idx === tokens.length) return [{ path, value: node }];
  const tok = tokens[idx];

  switch (tok.type) {
    case "root":
      return evalFrom(tokens, idx + 1, node, "$");

    case "member": {
      if (!isPlainObject(node) || !(tok.name in node)) return [];
      return evalFrom(tokens, idx + 1, node[tok.name], `${path}.${tok.name}`);
    }

    case "index": {
      if (!Array.isArray(node)) return [];
      const i = tok.index < 0 ? node.length + tok.index : tok.index;
      if (i < 0 || i >= node.length) return [];
      return evalFrom(tokens, idx + 1, node[i], `${path}[${i}]`);
    }

    case "wildcard": {
      const results: JsonPathMatch[] = [];
      if (Array.isArray(node)) {
        node.forEach((v, i) => results.push(...evalFrom(tokens, idx + 1, v, `${path}[${i}]`)));
      } else if (isPlainObject(node)) {
        for (const k of Object.keys(node)) results.push(...evalFrom(tokens, idx + 1, node[k], `${path}.${k}`));
      }
      return results;
    }

    case "slice": {
      if (!Array.isArray(node)) return [];
      const indices = resolveSlice(node.length, tok);
      const results: JsonPathMatch[] = [];
      for (const i of indices) results.push(...evalFrom(tokens, idx + 1, node[i], `${path}[${i}]`));
      return results;
    }

    case "union": {
      const results: JsonPathMatch[] = [];
      for (const v of tok.values) {
        if (typeof v === "string") {
          if (isPlainObject(node) && v in node) results.push(...evalFrom(tokens, idx + 1, node[v], `${path}.${v}`));
        } else if (Array.isArray(node)) {
          const i = v < 0 ? node.length + v : v;
          if (i >= 0 && i < node.length) results.push(...evalFrom(tokens, idx + 1, node[i], `${path}[${i}]`));
        }
      }
      return results;
    }

    case "recursive": {
      const results: JsonPathMatch[] = [];
      const walk = (n: unknown, p: string) => {
        results.push(...evalFrom(tokens, idx + 1, n, p));
        if (Array.isArray(n)) {
          n.forEach((v, i) => walk(v, `${p}[${i}]`));
        } else if (isPlainObject(n)) {
          for (const k of Object.keys(n)) walk(n[k], `${p}.${k}`);
        }
      };
      walk(node, path);
      return results;
    }
  }
}

export function queryJsonPath(data: unknown, path: string): JsonPathMatch[] {
  const tokens = parseJsonPath(path);
  const startsWithRoot = tokens[0]?.type === "root";
  return evalFrom(tokens, startsWithRoot ? 1 : 0, data, "$");
}
