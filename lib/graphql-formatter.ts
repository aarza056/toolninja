type TokType = "name" | "punct" | "spread" | "string" | "comment";
interface Tok {
  type: TokType;
  value: string;
}

const OPERATION_KEYWORDS = new Set(["query", "mutation", "subscription", "fragment"]);
const GLUE_BEFORE = new Set([":", ",", ")", "]", "!", "("]); // these attach directly to the previous token, no space
const GLUE_AFTER = new Set(["(", "[", "$", "@"]); // nothing after these gets a leading space

function isOn(tok: Tok | null): boolean {
  return tok !== null && tok.type === "name" && tok.value === "on";
}

function tokenize(input: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "#") {
      let j = i;
      while (j < n && input[j] !== "\n") j++;
      tokens.push({ type: "comment", value: input.slice(i, j).trimEnd() });
      i = j;
      continue;
    }
    if (input.startsWith('"""', i)) {
      let j = i + 3;
      while (j < n && !input.startsWith('"""', j)) j++;
      j = Math.min(n, j + 3);
      tokens.push({ type: "string", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < n && input[j] !== '"') {
        if (input[j] === "\\") j++;
        j++;
      }
      j = Math.min(n, j + 1);
      tokens.push({ type: "string", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (input.startsWith("...", i)) {
      tokens.push({ type: "spread", value: "..." });
      i += 3;
      continue;
    }
    if ("{}()[]:!=@$,".includes(ch)) {
      tokens.push({ type: "punct", value: ch });
      i++;
      continue;
    }
    let j = i;
    while (j < n && /[A-Za-z0-9_.\-]/.test(input[j])) j++;
    if (j === i) {
      i++;
      continue;
    }
    tokens.push({ type: "name", value: input.slice(i, j) });
    i = j;
  }
  return tokens;
}

/** Pretty-prints a GraphQL document (query/mutation/subscription/fragment) with
 * consistent indentation. Not a full spec-compliant parser — a token-stream
 * reformatter that covers the syntax developers actually write day to day. */
export function formatGraphQL(input: string, indentSize = 2): string {
  const tokens = tokenize(input);
  const IND = " ".repeat(indentSize);
  let out = "";
  let depth = 0;
  let parenDepth = 0;
  let prev: Tok | null = null;
  let afterOperationKeyword = false;

  const trimTrailingSpace = () => {
    out = out.replace(/[ \t]+$/, "");
  };

  for (const tok of tokens) {
    if (tok.type === "punct" && tok.value === "{") {
      trimTrailingSpace();
      out += " {\n" + IND.repeat(++depth);
      prev = tok;
      afterOperationKeyword = false;
      continue;
    }
    if (tok.type === "punct" && tok.value === "}") {
      depth = Math.max(0, depth - 1);
      trimTrailingSpace();
      out += "\n" + IND.repeat(depth) + "}";
      prev = tok;
      continue;
    }
    if (tok.type === "punct" && tok.value === "(") {
      out += "(";
      parenDepth++;
      prev = tok;
      continue;
    }
    if (tok.type === "punct" && tok.value === ")") {
      trimTrailingSpace();
      out += ")";
      parenDepth = Math.max(0, parenDepth - 1);
      prev = tok;
      continue;
    }
    if (tok.type === "punct" && tok.value === ",") {
      trimTrailingSpace();
      if (parenDepth > 0) {
        out += ", ";
      } else {
        out += "\n" + IND.repeat(depth);
      }
      prev = tok;
      continue;
    }

    // "on" (inline fragment / fragment definition type condition) and the type
    // name that follows it always stay glued to the current line: "... on Type"
    // or "fragment Name on Type". Handle both before the generic field-break logic.
    if (isOn(tok) || isOn(prev)) {
      out += " " + tok.value;
      afterOperationKeyword = false;
      prev = tok;
      continue;
    }
    // Named fragment spread ("...FragmentName") glues with no space — but only
    // when not followed by "on", which is handled by the branch above.
    if (prev !== null && prev.type === "spread") {
      out += tok.value;
      afterOperationKeyword = false;
      prev = tok;
      continue;
    }

    // Does this token start a new field/line at the current selection-set depth?
    const isFieldStart = tok.type === "name" || tok.type === "string" || tok.type === "spread" || tok.type === "comment";
    const prevEndedAField =
      prev !== null &&
      parenDepth === 0 &&
      !afterOperationKeyword &&
      ((prev.type === "name" && !OPERATION_KEYWORDS.has(prev.value)) ||
        prev.type === "string" ||
        prev.type === "spread" ||
        prev.type === "comment" ||
        (prev.type === "punct" && (prev.value === "}" || prev.value === ")" || prev.value === "!" || prev.value === "]")));

    if (isFieldStart && prevEndedAField) {
      trimTrailingSpace();
      out += "\n" + IND.repeat(depth) + tok.value;
    } else {
      const needsSpace =
        prev !== null &&
        !(tok.type === "punct" && GLUE_BEFORE.has(tok.value)) &&
        !(prev.type === "punct" && GLUE_AFTER.has(prev.value)) &&
        out.length > 0 &&
        !/[\s{([@$]$/.test(out);
      out += (needsSpace ? " " : "") + tok.value;
    }

    if (tok.type === "punct" && tok.value === ":") {
      out += " "; // space after colon: "key: value"
    }

    afterOperationKeyword = tok.type === "name" && OPERATION_KEYWORDS.has(tok.value);
    prev = tok;
  }

  return out.trim() + "\n";
}

export function minifyGraphQL(input: string): string {
  const tokens = tokenize(input).filter((t) => t.type !== "comment");
  let out = "";
  let prev: Tok | null = null;
  for (const tok of tokens) {
    if (isOn(tok) || isOn(prev)) {
      out += " " + tok.value;
      prev = tok;
      continue;
    }
    if (prev !== null && prev.type === "spread") {
      out += tok.value;
      prev = tok;
      continue;
    }
    const needsSpace =
      prev !== null &&
      !(tok.type === "punct" && GLUE_BEFORE.has(tok.value)) &&
      !(prev.type === "punct" && GLUE_AFTER.has(prev.value));
    out += (needsSpace ? " " : "") + tok.value;
    prev = tok;
  }
  return out.trim();
}

export interface GraphQLVariable {
  name: string;
  type: string;
  required: boolean;
}

/** Reads the `($var: Type, ...)` declaration list right after the operation keyword/name —
 * the only place GraphQL variables are declared, so anonymous shorthand queries (bare `{ ... }`
 * with no operation header) simply have none to find. */
export function extractVariables(query: string): GraphQLVariable[] {
  const headerMatch = query.match(/^\s*(?:query|mutation|subscription)\s*[A-Za-z_]\w*\s*\(([^)]*)\)/);
  if (!headerMatch) return [];

  const varRe = /\$([A-Za-z_]\w*)\s*:\s*([^,=]+?)\s*(?:=\s*[^,]+)?(?:,|$)/g;
  const vars: GraphQLVariable[] = [];
  let m: RegExpExecArray | null;
  while ((m = varRe.exec(headerMatch[1])) !== null) {
    const type = m[2].trim();
    vars.push({ name: m[1], type, required: type.endsWith("!") });
  }
  return vars;
}

function sampleValueForType(type: string): unknown {
  const base = type.replace(/[!\[\]]/g, "").trim();
  const isList = type.includes("[");
  let sample: unknown;
  switch (base) {
    case "String":
    case "ID":
      sample = "";
      break;
    case "Int":
    case "Float":
      sample = 0;
      break;
    case "Boolean":
      sample = false;
      break;
    default:
      sample = null; // custom scalar, enum, or input type — can't guess a shape
  }
  return isList ? [sample] : sample;
}

/** Produces a starter variables JSON object for a query's declared $variables — placeholder
 * values typed by GraphQL scalar (empty string, 0, false), null for anything custom. */
export function buildSampleVariables(query: string): string {
  const vars = extractVariables(query);
  if (vars.length === 0) return "{}";
  const obj: Record<string, unknown> = {};
  for (const v of vars) obj[v.name] = sampleValueForType(v.type);
  return JSON.stringify(obj, null, 2);
}
