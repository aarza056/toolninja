export interface PatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

function escapeToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

function unescapeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function parsePointer(path: string): string[] {
  if (path === "") return [];
  if (!path.startsWith("/")) throw new Error(`Invalid JSON Pointer "${path}" — must start with "/".`);
  return path.slice(1).split("/").map(unescapeToken);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (typeof a === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    const bk = Object.keys(bo);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => k in bo && deepEqual(ao[k], bo[k]));
  }
  return false;
}

/** Produces a correct (not necessarily minimal) RFC 6902 patch — arrays are diffed positionally
 * rather than with an LCS alignment, so an insertion in the middle of a long array will show as
 * a run of replaces rather than a single insert. Objects and scalars diff exactly. */
export function generateJsonPatch(a: unknown, b: unknown, basePath = ""): PatchOp[] {
  if (deepEqual(a, b)) return [];

  if (Array.isArray(a) && Array.isArray(b)) {
    const ops: PatchOp[] = [];
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      ops.push(...generateJsonPatch(a[i], b[i], `${basePath}/${i}`));
    }
    if (b.length > a.length) {
      for (let i = a.length; i < b.length; i++) {
        ops.push({ op: "add", path: `${basePath}/${i}`, value: b[i] });
      }
    } else if (a.length > b.length) {
      for (let i = a.length - 1; i >= b.length; i--) {
        ops.push({ op: "remove", path: `${basePath}/${i}` });
      }
    }
    return ops;
  }

  if (
    typeof a === "object" && a !== null && !Array.isArray(a) &&
    typeof b === "object" && b !== null && !Array.isArray(b)
  ) {
    const ops: PatchOp[] = [];
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    for (const key of Object.keys(ao)) {
      const childPath = `${basePath}/${escapeToken(key)}`;
      if (!(key in bo)) ops.push({ op: "remove", path: childPath });
      else ops.push(...generateJsonPatch(ao[key], bo[key], childPath));
    }
    for (const key of Object.keys(bo)) {
      if (!(key in ao)) ops.push({ op: "add", path: `${basePath}/${escapeToken(key)}`, value: bo[key] });
    }
    return ops;
  }

  return [{ op: "replace", path: basePath, value: b }];
}

function getParent(doc: unknown, tokens: string[]): { parent: Record<string, unknown> | unknown[]; key: string } {
  let cur: unknown = doc;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    cur = Array.isArray(cur) ? cur[Number(t)] : (cur as Record<string, unknown> | null | undefined)?.[t];
  }
  return { parent: cur as Record<string, unknown> | unknown[], key: tokens[tokens.length - 1] };
}

function getValueAtPointer(doc: unknown, path: string): unknown {
  let cur: unknown = doc;
  for (const t of parsePointer(path)) {
    cur = Array.isArray(cur) ? cur[Number(t)] : (cur as Record<string, unknown> | null | undefined)?.[t];
  }
  return cur;
}

function applySingleOp(doc: unknown, op: PatchOp): void {
  const tokens = parsePointer(op.path);
  if (tokens.length === 0) throw new Error(`"${op.op}" at the root path requires special handling and can't be applied as a single op.`);
  const { parent, key } = getParent(doc, tokens);
  if (parent === undefined || parent === null) throw new Error(`Path "${op.path}" does not exist in the document.`);

  if (Array.isArray(parent)) {
    if (op.op === "add") {
      const idx = key === "-" ? parent.length : Number(key);
      if (Number.isNaN(idx) || idx < 0 || idx > parent.length) throw new Error(`Path "${op.path}" — invalid array index for add.`);
      parent.splice(idx, 0, op.value);
    } else if (op.op === "remove") {
      const idx = Number(key);
      if (Number.isNaN(idx) || idx < 0 || idx >= parent.length) throw new Error(`Path "${op.path}" — array index out of bounds for remove.`);
      parent.splice(idx, 1);
    } else if (op.op === "replace") {
      const idx = Number(key);
      if (Number.isNaN(idx) || idx < 0 || idx >= parent.length) throw new Error(`Path "${op.path}" — array index out of bounds for replace.`);
      parent[idx] = op.value;
    }
  } else {
    const obj = parent as Record<string, unknown>;
    if (op.op === "add") {
      obj[key] = op.value;
    } else if (op.op === "remove") {
      if (!(key in obj)) throw new Error(`Path "${op.path}" does not exist — cannot remove.`);
      delete obj[key];
    } else if (op.op === "replace") {
      if (!(key in obj)) throw new Error(`Path "${op.path}" does not exist — cannot replace.`);
      obj[key] = op.value;
    }
  }
}

/** Applies an RFC 6902 patch — supports add/remove/replace/move/copy/test, including patches
 * from other tools (git, fast-json-patch, etc.), not just ones this module itself generates. */
export function applyJsonPatch(doc: unknown, patch: PatchOp[]): unknown {
  let result: unknown = JSON.parse(JSON.stringify(doc ?? null));

  for (const op of patch) {
    if (op.path === "" && (op.op === "add" || op.op === "replace")) {
      result = JSON.parse(JSON.stringify(op.value));
      continue;
    }
    if (op.op === "test") {
      const actual = op.path === "" ? result : getValueAtPointer(result, op.path);
      if (!deepEqual(actual, op.value)) {
        throw new Error(`"test" failed at "${op.path || "(root)"}" — expected ${JSON.stringify(op.value)}, found ${JSON.stringify(actual)}.`);
      }
      continue;
    }
    if (op.op === "move") {
      if (op.from === undefined) throw new Error(`"move" at "${op.path}" is missing "from".`);
      const value = getValueAtPointer(result, op.from);
      applySingleOp(result, { op: "remove", path: op.from });
      applySingleOp(result, { op: "add", path: op.path, value });
      continue;
    }
    if (op.op === "copy") {
      if (op.from === undefined) throw new Error(`"copy" at "${op.path}" is missing "from".`);
      const value = getValueAtPointer(result, op.from);
      applySingleOp(result, { op: "add", path: op.path, value: JSON.parse(JSON.stringify(value ?? null)) });
      continue;
    }
    applySingleOp(result, op);
  }

  return result;
}
