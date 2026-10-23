// Converts between a practical, common subset of CSS selectors and XPath 1.0 expressions.
// CSS → XPath supports: tag, #id, .class (multiple), [attr]/[attr=val]/[attr^=val]/[attr$=val]/
// [attr*=val]/[attr~=val], combinators (space, >, +, ~), :first-child/:last-child/:nth-child(n),
// and comma-separated selector lists. Not supported: :not(), :hover and other dynamic
// pseudo-classes, pseudo-elements — these have no meaningful XPath equivalent in this scope.
// XPath → CSS only reverses output this converter itself would produce (simple // and / steps
// with the predicate patterns above) — arbitrary XPath using other axes or functions has no CSS
// equivalent and throws a clear error naming what wasn't understood.

interface AttrSelector {
  name: string;
  op?: string;
  value?: string;
}

interface CompoundSelector {
  tag: string;
  id: string | null;
  classes: string[];
  attrs: AttrSelector[];
  pseudos: string[];
}

type Combinator = " " | ">" | "+" | "~" | null;

function splitTopLevel(input: string, splitChar: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (depth === 0 && ch === splitChar) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));
  return parts;
}

function parseCompoundChain(selector: string): { compound: string; combinator: Combinator }[] {
  const normalized = selector.trim().replace(/\s*([>+~])\s*/g, "$1").replace(/\s+/g, " ");
  const tokens: { compound: string; combinator: Combinator }[] = [];
  let depth = 0;
  let start = 0;
  let pending: Combinator = null;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (depth === 0 && (ch === ">" || ch === "+" || ch === "~" || ch === " ")) {
      const compound = normalized.slice(start, i);
      if (compound) tokens.push({ compound, combinator: pending });
      pending = ch as Combinator;
      start = i + 1;
    }
  }
  const last = normalized.slice(start);
  if (last) tokens.push({ compound: last, combinator: pending });
  return tokens;
}

function parseAttr(raw: string): AttrSelector {
  const m = raw.match(/^([\w-]+)\s*(?:([~^$*|]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]+)))?$/);
  if (!m) throw new Error(`Unsupported attribute selector: [${raw}]`);
  const name = m[1];
  if (!m[2]) return { name };
  return { name, op: m[2], value: (m[3] ?? m[4] ?? m[5] ?? "").trim() };
}

function parseCompound(compound: string): CompoundSelector {
  const result: CompoundSelector = { tag: "*", id: null, classes: [], attrs: [], pseudos: [] };
  const re = /([a-zA-Z][\w-]*)|\.([\w-]+)|#([\w-]+)|\[([^\]]+)\]|:([\w-]+(?:\([^)]*\))?)/g;
  let m: RegExpExecArray | null;
  let tagSeen = false;
  while ((m = re.exec(compound))) {
    if (m[1] && !tagSeen) {
      result.tag = m[1];
      tagSeen = true;
    } else if (m[2]) result.classes.push(m[2]);
    else if (m[3]) result.id = m[3];
    else if (m[4]) result.attrs.push(parseAttr(m[4]));
    else if (m[5]) result.pseudos.push(m[5]);
  }
  return result;
}

function buildXPathPredicates(c: CompoundSelector): string {
  const preds: string[] = [];
  if (c.id) preds.push(`@id='${c.id}'`);
  for (const cls of c.classes) {
    preds.push(`contains(concat(' ', normalize-space(@class), ' '), ' ${cls} ')`);
  }
  for (const a of c.attrs) {
    if (!a.op) preds.push(`@${a.name}`);
    else if (a.op === "=") preds.push(`@${a.name}='${a.value}'`);
    else if (a.op === "^=") preds.push(`starts-with(@${a.name}, '${a.value}')`);
    else if (a.op === "*=") preds.push(`contains(@${a.name}, '${a.value}')`);
    else if (a.op === "~=") preds.push(`contains(concat(' ', normalize-space(@${a.name}), ' '), ' ${a.value} ')`);
    else if (a.op === "$=") {
      preds.push(`substring(@${a.name}, string-length(@${a.name}) - ${(a.value ?? "").length - 1}) = '${a.value}'`);
    } else {
      throw new Error(`Unsupported attribute operator "${a.op}" in [${a.name}${a.op}${a.value}]`);
    }
  }
  for (const p of c.pseudos) {
    const nth = p.match(/^nth-child\((\d+)\)$/);
    if (p === "first-child") preds.push("position()=1");
    else if (p === "last-child") preds.push("position()=last()");
    else if (nth) preds.push(`position()=${nth[1]}`);
    else throw new Error(`Unsupported pseudo-class ":${p}" — only :first-child, :last-child, and :nth-child(n) are supported.`);
  }
  return preds.map((p) => `[${p}]`).join("");
}

function convertSingleSelector(selector: string): string {
  const chain = parseCompoundChain(selector);
  if (chain.length === 0) throw new Error("Empty selector");

  let xpath = "";
  chain.forEach((tok, idx) => {
    const c = parseCompound(tok.compound);
    const predicate = buildXPathPredicates(c);
    const tag = c.tag;

    if (idx === 0) {
      xpath += `//${tag}${predicate}`;
      return;
    }
    switch (tok.combinator) {
      case ">":
        xpath += `/${tag}${predicate}`;
        break;
      case " ":
        xpath += `//${tag}${predicate}`;
        break;
      case "+":
        xpath += `/following-sibling::*[1][self::${tag}]${predicate}`;
        break;
      case "~":
        xpath += `/following-sibling::${tag}${predicate}`;
        break;
    }
  });
  return xpath;
}

export function cssToXPath(selector: string): string {
  const selectors = splitTopLevel(selector, ",").map((s) => s.trim()).filter(Boolean);
  if (selectors.length === 0) throw new Error("Enter a CSS selector");
  return selectors.map(convertSingleSelector).join(" | ");
}

// --- XPath -> CSS -------------------------------------------------------

function tokenizeXPathSteps(xpath: string): { sep: "//" | "/"; step: string }[] {
  if (!xpath.startsWith("/")) throw new Error("XPath expression must start with / or //");
  let sep: "//" | "/" = xpath.startsWith("//") ? "//" : "/";
  let i = sep.length;
  const steps: { sep: "//" | "/"; step: string }[] = [];
  let depth = 0;
  let start = i;

  while (i < xpath.length) {
    const ch = xpath[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (depth === 0 && ch === "/") {
      steps.push({ sep, step: xpath.slice(start, i) });
      if (xpath[i + 1] === "/") {
        sep = "//";
        i++;
      } else {
        sep = "/";
      }
      start = i + 1;
    }
    i++;
  }
  steps.push({ sep, step: xpath.slice(start) });
  return steps;
}

function convertPredicateToCss(pred: string): string {
  let m: RegExpMatchArray | null;
  if ((m = pred.match(/^@id='([^']*)'$/))) return `#${m[1]}`;
  if ((m = pred.match(/^contains\(concat\(' ', normalize-space\(@class\), ' '\), ' ([^']+) '\)$/))) return `.${m[1]}`;
  if ((m = pred.match(/^contains\(concat\(' ', normalize-space\(@([\w-]+)\), ' '\), ' ([^']+) '\)$/))) return `[${m[1]}~="${m[2]}"]`;
  if ((m = pred.match(/^@([\w-]+)='([^']*)'$/))) return `[${m[1]}="${m[2]}"]`;
  if ((m = pred.match(/^@([\w-]+)$/))) return `[${m[1]}]`;
  if ((m = pred.match(/^starts-with\(@([\w-]+),\s*'([^']*)'\)$/))) return `[${m[1]}^="${m[2]}"]`;
  if ((m = pred.match(/^contains\(@([\w-]+),\s*'([^']*)'\)$/))) return `[${m[1]}*="${m[2]}"]`;
  if (pred === "position()=1") return ":first-child";
  if (pred === "position()=last()") return ":last-child";
  if ((m = pred.match(/^position\(\)=(\d+)$/))) return `:nth-child(${m[1]})`;
  throw new Error(`No CSS equivalent for predicate [${pred}] — this converter only recognizes the predicate shapes it itself generates from CSS.`);
}

function stepToCssCompound(step: string): string {
  const m = step.match(/^([a-zA-Z*][\w-]*)((?:\[[^\]]*\])*)$/);
  if (!m) {
    throw new Error(`Can't convert the step "${step}" to CSS — only tag[predicate] steps are supported, not axes like following-sibling:: or functions like text().`);
  }
  const tag = m[1] === "*" ? "" : m[1];
  const predicates = Array.from(m[2].matchAll(/\[([^\]]*)\]/g)).map((x) => convertPredicateToCss(x[1]));
  return tag + predicates.join("");
}

export function xpathToCss(xpath: string): string {
  const trimmed = xpath.trim();
  if (!trimmed) throw new Error("Enter an XPath expression");
  const steps = tokenizeXPathSteps(trimmed);

  let css = "";
  steps.forEach((s, idx) => {
    const compound = stepToCssCompound(s.step);
    css += idx === 0 ? compound : (s.sep === "//" ? " " : " > ") + compound;
  });
  return css;
}
