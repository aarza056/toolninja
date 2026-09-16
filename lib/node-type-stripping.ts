export interface StrippingFinding {
  kind: "enum" | "parameter-property" | "namespace" | "decorator";
  snippet: string;
  line: number;
  message: string;
}

function lineOf(code: string, index: number): number {
  return code.slice(0, index).split("\n").length;
}

function findMatchingParen(text: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitTopLevelParams(paramsText: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of paramsText) {
    if ("([{<".includes(ch)) depth++;
    if (")]}>".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Heuristic, regex/bracket-based scan for TypeScript syntax that Node's built-in type
 * stripping (the `amaro`-powered `--experimental-strip-types`, on by default since Node 24)
 * can erase syntax but can't emit runtime code for. This is not a real parser — it can't see
 * through template literals or block comments perfectly — treat findings as "review this",
 * not a definitive pass/fail. */
export function findTypeStrippingIssues(code: string): StrippingFinding[] {
  const findings: StrippingFinding[] = [];

  const enumRegex = /\b(const\s+)?enum\s+([A-Za-z_$][\w$]*)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = enumRegex.exec(code))) {
    findings.push({
      kind: "enum",
      snippet: `${m[1] ?? ""}enum ${m[2]}`,
      line: lineOf(code, m.index),
      message: "Enums compile to a runtime object — type stripping only erases type syntax, it can't generate that object. Use a union type + const object, or a plain object with `as const`, instead.",
    });
  }

  const ctorRegex = /constructor\s*\(/g;
  while ((m = ctorRegex.exec(code))) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = findMatchingParen(code, openIdx);
    if (closeIdx === -1) continue;
    const paramsText = code.slice(openIdx + 1, closeIdx);
    for (const p of splitTopLevelParams(paramsText)) {
      const trimmed = p.trim();
      const modMatch = /^(public|private|protected|readonly)\b/.exec(trimmed);
      if (modMatch) {
        findings.push({
          kind: "parameter-property",
          snippet: trimmed.split(/[:=\n]/)[0].trim(),
          line: lineOf(code, m.index),
          message: "Parameter properties (a modifier directly on a constructor parameter) generate a runtime field assignment — type stripping can't add that assignment. Declare the field explicitly and assign it in the constructor body instead.",
        });
      }
    }
  }

  const namespaceRegex = /(^|\n)\s*(declare\s+)?(namespace|module)\s+([A-Za-z_$][\w$.]*|"[^"]*"|'[^']*')\s*\{/g;
  while ((m = namespaceRegex.exec(code))) {
    const isAmbientStringModule = /^["']/.test(m[4]);
    if (m[2] || isAmbientStringModule) continue; // `declare module` / ambient string-name modules are type-only, unaffected
    findings.push({
      kind: "namespace",
      snippet: `${m[3]} ${m[4]}`,
      line: lineOf(code, m.index),
      message: "A namespace/module block that contains runtime values (not just types) compiles to a runtime IIFE object — type stripping can't generate that. If this namespace only declares types/interfaces, it's fine; if it exports runtime values (const, function, class), it isn't.",
    });
  }

  const decoratorRegex = /(^|\n)[ \t]*@[A-Za-z_$][\w$]*/g;
  while ((m = decoratorRegex.exec(code))) {
    findings.push({
      kind: "decorator",
      snippet: m[0].trim(),
      line: lineOf(code, m.index),
      message: "Decorators need code generation (metadata, wrapping), not just erasure — type stripping alone can't apply them. They need a real compile step (tsc, SWC, Babel) or Node's separate experimental decorators support.",
    });
  }

  return findings.sort((a, b) => a.line - b.line);
}
