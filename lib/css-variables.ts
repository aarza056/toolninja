export interface CssVariableDeclaration {
  name: string;
  value: string;
  selector: string;
}

export interface CssVariableUsage {
  name: string;
  count: number;
}

export interface CssVariableReport {
  declarations: CssVariableDeclaration[];
  usages: CssVariableUsage[];
  unused: string[];
  undefinedUsed: string[];
  duplicates: string[];
}

/** Best-effort selector lookup: walks backward from a declaration to the nearest unmatched "{"
 * and takes the text right before it as the selector. Doesn't track full nesting depth (e.g. a
 * variable inside a @media block), so the reported selector is the innermost rule, not the full
 * context chain — good enough for spotting where a token lives, not for a true CSS parser. */
function nearestSelector(cssBefore: string): string {
  const lastOpen = cssBefore.lastIndexOf("{");
  if (lastOpen === -1) return ":root";
  const lastClose = cssBefore.lastIndexOf("}");
  const start = lastClose + 1;
  const selector = cssBefore.slice(start, lastOpen).trim().split("\n").pop()?.trim();
  return selector || ":root";
}

export function analyzeCssVariables(css: string): CssVariableReport {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");

  const declarations: CssVariableDeclaration[] = [];
  const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(clean)) !== null) {
    declarations.push({
      name: m[1],
      value: m[2].trim(),
      selector: nearestSelector(clean.slice(0, m.index)),
    });
  }

  const usageMap = new Map<string, number>();
  const usageRe = /var\(\s*(--[a-zA-Z0-9-_]+)/g;
  while ((m = usageRe.exec(clean)) !== null) {
    usageMap.set(m[1], (usageMap.get(m[1]) ?? 0) + 1);
  }
  const usages = Array.from(usageMap.entries()).map(([name, count]) => ({ name, count }));

  const declaredNames = new Set(declarations.map((d) => d.name));
  const usedNames = new Set(usages.map((u) => u.name));

  const unused = Array.from(declaredNames).filter((n) => !usedNames.has(n));
  const undefinedUsed = Array.from(usedNames).filter((n) => !declaredNames.has(n));

  const valuesByName = new Map<string, Set<string>>();
  for (const d of declarations) {
    if (!valuesByName.has(d.name)) valuesByName.set(d.name, new Set());
    valuesByName.get(d.name)!.add(d.value);
  }
  const duplicates = Array.from(valuesByName.entries())
    .filter(([, values]) => values.size > 1)
    .map(([name]) => name);

  return { declarations, usages, unused, undefinedUsed, duplicates };
}
