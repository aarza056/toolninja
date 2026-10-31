// Paths to a value inside a JSON document, written the way each language/tool expects them. Used by
// the JSON Path Finder: click a node, get its path for JSONPath, JavaScript, jq and Python.

export type Segment = string | number;
export type PathStyle = "jsonpath" | "javascript" | "jq" | "python";

export const PATH_STYLES: { id: PathStyle; label: string }[] = [
  { id: "jsonpath", label: "JSONPath" },
  { id: "javascript", label: "JavaScript" },
  { id: "jq", label: "jq" },
  { id: "python", label: "Python" },
];

const JS_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JQ_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

const dq = (k: string) => JSON.stringify(k);
/** JSONPath bracket notation uses single quotes; escape backslashes and quotes inside */
const sq = (k: string) => `'${k.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** `wildcard` turns every array index into [*] (all items), e.g. $.items[*].name */
export function formatPath(path: Segment[], style: PathStyle, opts: { root?: string; wildcard?: boolean } = {}): string {
  const wild = opts.wildcard;
  if (style === "jsonpath") {
    return (
      "$" +
      path
        .map((s) => (typeof s === "number" ? (wild ? "[*]" : `[${s}]`) : JS_IDENT.test(s) ? `.${s}` : `[${sq(s)}]`))
        .join("")
    );
  }
  if (style === "javascript") {
    const root = opts.root ?? "data";
    if (wild) {
      // An index becomes a .map() over the array; the rest of the path applies to each item
      let out = root;
      let inMap = 0;
      for (const s of path) {
        if (typeof s === "number") {
          out += `.map((item${inMap || ""}) => item${inMap || ""}`;
          inMap++;
        } else out += JS_IDENT.test(s) ? `.${s}` : `[${dq(s)}]`;
      }
      return out + ")".repeat(inMap);
    }
    return root + path.map((s) => (typeof s === "number" ? `[${s}]` : JS_IDENT.test(s) ? `.${s}` : `[${dq(s)}]`)).join("");
  }
  if (style === "jq") {
    // .key for plain names, ["key"] otherwise, [n] / [] for arrays; a leading [ needs a dot: .["a b"]
    const s = path.map((x) => (typeof x === "number" ? (wild ? "[]" : `[${x}]`) : JQ_IDENT.test(x) ? `.${x}` : `[${dq(x)}]`)).join("");
    return s.startsWith("[") ? `.${s}` : s || ".";
  }
  // python
  const root = opts.root ?? "data";
  if (wild && path.some((s) => typeof s === "number")) {
    // A list comprehension over the first array; deeper arrays are nested comprehensions
    const build = (segs: Segment[], src: string, depth: number): string => {
      const i = segs.findIndex((s) => typeof s === "number");
      const access = (seg: Segment[]) => seg.map((s) => `[${typeof s === "number" ? s : dq(s)}]`).join("");
      if (i < 0) return `${src}${access(segs)}`;
      const v = depth ? `item${depth}` : "item";
      return `[${build(segs.slice(i + 1), v, depth + 1)} for ${v} in ${src}${access(segs.slice(0, i))}]`;
    };
    return build(path, root, 0);
  }
  return root + path.map((s) => `[${typeof s === "number" ? s : dq(s)}]`).join("");
}

export interface Match {
  path: Segment[];
  /** "key" when the search text matched the key name, "value" when it matched a scalar value */
  on: "key" | "value";
  preview: string;
}

/** Every place where a key or a scalar value contains the text (case-insensitive), in document order */
export function searchJson(root: unknown, text: string, limit = 200): Match[] {
  const q = text.trim().toLowerCase();
  const out: Match[] = [];
  if (!q) return out;
  const visit = (v: unknown, path: Segment[]) => {
    if (out.length >= limit) return;
    if (Array.isArray(v)) v.forEach((x, i) => visit(x, [...path, i]));
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (out.length >= limit) return;
        if (k.toLowerCase().includes(q)) out.push({ path: [...path, k], on: "key", preview: previewValue(x) });
        visit(x, [...path, k]);
      }
    } else if (String(v).toLowerCase().includes(q)) out.push({ path, on: "value", preview: previewValue(v) });
  };
  visit(root, []);
  return out;
}

export function getAt(root: unknown, path: Segment[]): unknown {
  let v: unknown = root;
  for (const s of path) v = v == null ? undefined : (v as Record<string | number, unknown>)[s];
  return v;
}

/** A short one-line description of a value for lists and tooltips */
export function previewValue(v: unknown, max = 60): string {
  if (Array.isArray(v)) return `[ ${v.length} item${v.length === 1 ? "" : "s"} ]`;
  if (v && typeof v === "object") {
    const n = Object.keys(v).length;
    return `{ ${n} key${n === 1 ? "" : "s"} }`;
  }
  const s = JSON.stringify(v) ?? String(v);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
