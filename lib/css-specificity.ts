export interface Specificity {
  ids: number;
  classes: number;
  types: number;
}

function splitCompounds(selector: string): string[] {
  const compounds: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of selector.trim()) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && /[\s>+~]/.test(ch)) {
      if (current) compounds.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) compounds.push(current);
  return compounds;
}

function splitArgList(args: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of args) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) result.push(current);
  return result.filter((s) => s.trim());
}

const BALANCED_PARENS = "(?:[^()]|\\([^()]*\\))*";

/** Computes CSS selector specificity as (ids, classes-and-attrs-and-pseudo-classes, types-and-pseudo-elements),
 * following the CSS Selectors spec. :where() always contributes 0; :not()/:is()/:has() contribute the
 * specificity of their single most specific argument, not counted as a pseudo-class themselves. */
export function computeSpecificity(selector: string): Specificity {
  const compounds = splitCompounds(selector);
  let ids = 0;
  let classes = 0;
  let types = 0;

  for (const compound of compounds) {
    let rest = compound;

    rest = rest.replace(new RegExp(`:where\\(${BALANCED_PARENS}\\)`, "gi"), "");

    rest = rest.replace(new RegExp(`:(not|is|has)\\((${BALANCED_PARENS})\\)`, "gi"), (_m, _fn, args) => {
      const argSelectors = splitArgList(args);
      let best: Specificity = { ids: 0, classes: 0, types: 0 };
      for (const arg of argSelectors) {
        const s = computeSpecificity(arg.trim());
        if (
          s.ids > best.ids ||
          (s.ids === best.ids && s.classes > best.classes) ||
          (s.ids === best.ids && s.classes === best.classes && s.types > best.types)
        ) {
          best = s;
        }
      }
      ids += best.ids;
      classes += best.classes;
      types += best.types;
      return "";
    });

    const idMatches = rest.match(/#[\w-]+/g);
    if (idMatches) ids += idMatches.length;
    rest = rest.replace(/#[\w-]+/g, "");

    const classMatches = rest.match(/\.[\w-]+/g);
    if (classMatches) classes += classMatches.length;
    rest = rest.replace(/\.[\w-]+/g, "");

    const attrMatches = rest.match(/\[[^\]]*\]/g);
    if (attrMatches) classes += attrMatches.length;
    rest = rest.replace(/\[[^\]]*\]/g, "");

    const legacyPseudoElements = /:(before|after|first-line|first-letter)\b/gi;
    const legacyMatches = rest.match(legacyPseudoElements);
    if (legacyMatches) types += legacyMatches.length;
    rest = rest.replace(legacyPseudoElements, "");

    const pseudoElMatches = rest.match(/::[\w-]+/g);
    if (pseudoElMatches) types += pseudoElMatches.length;
    rest = rest.replace(/::[\w-]+/g, "");

    const pseudoClassMatches = rest.match(/:[\w-]+/g);
    if (pseudoClassMatches) classes += pseudoClassMatches.length;
    rest = rest.replace(/:[\w-]+/g, "");

    const typeMatches = rest.match(/[a-zA-Z][\w-]*/g);
    if (typeMatches) types += typeMatches.length;
  }

  return { ids, classes, types };
}

export function specificityToString(s: Specificity): string {
  return `(${s.ids},${s.classes},${s.types})`;
}

export function compareSpecificity(a: Specificity, b: Specificity): number {
  if (a.ids !== b.ids) return a.ids - b.ids;
  if (a.classes !== b.classes) return a.classes - b.classes;
  return a.types - b.types;
}
