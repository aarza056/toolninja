// Adapted from the same tag/text tokenizer approach used by lib/html-formatter equivalents in
// this project, with XML-specific handling: no implicit "void tags" (XML self-closing is always
// explicit via `/>`), and CDATA sections preserved verbatim like HTML's <pre>/<script> blocks.

const PLACEHOLDER_PREFIX = "\x00XMLRAW";

function extractCdataBlocks(xml: string): { xml: string; blocks: string[] } {
  const blocks: string[] = [];
  const result = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (match) => {
    const idx = blocks.length;
    blocks.push(match);
    return `${PLACEHOLDER_PREFIX}${idx}\x00`;
  });
  return { xml: result, blocks };
}

function restoreCdataBlocks(xml: string, blocks: string[]): string {
  return xml.replace(new RegExp(`${PLACEHOLDER_PREFIX}(\\d+)\x00`, "g"), (_, idx) => blocks[parseInt(idx, 10)]);
}

export interface XmlFormatResult {
  output: string;
  error?: string;
}

function validateBasicStructure(xml: string): string | undefined {
  const trimmed = xml.trim();
  if (!trimmed) return undefined;

  // Track open/close tag balance (ignoring self-closing, comments, CDATA, declarations).
  const withoutCdata = trimmed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  const withoutComments = withoutCdata.replace(/<!--[\s\S]*?-->/g, "");
  const tagRe = /<(\/?)([a-zA-Z_][\w.-]*(?::[a-zA-Z_][\w.-]*)?)[^>]*?(\/?)>/g;
  const stack: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(withoutComments)) !== null) {
    const [full, closing, name, selfClose] = m;
    if (full.startsWith("<?") || full.startsWith("<!")) continue;
    if (closing) {
      const expected = stack.pop();
      if (expected !== name) {
        return `Mismatched tag: expected </${expected ?? "?"}> but found </${name}>.`;
      }
    } else if (!selfClose && !full.endsWith("/>")) {
      stack.push(name);
    }
  }

  if (stack.length > 0) {
    return `Unclosed tag: <${stack[stack.length - 1]}> was never closed.`;
  }
  return undefined;
}

export function formatXml(xml: string, indentSize = 2): XmlFormatResult {
  if (!xml.trim()) return { output: "" };

  const structureError = validateBasicStructure(xml);
  if (structureError) return { output: "", error: structureError };

  const { xml: extracted, blocks } = extractCdataBlocks(xml);
  const pad = " ".repeat(indentSize);
  const lines: string[] = [];
  let level = 0;

  const TOKEN_RE = /(<[^>]+>)|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = TOKEN_RE.exec(extracted)) !== null) {
    const [, tag, text] = m;

    if (text !== undefined) {
      const t = text.trim();
      if (t) lines.push(pad.repeat(level) + t);
      continue;
    }
    if (!tag) continue;

    // Declaration (<?xml ... ?>) or DOCTYPE — emit as-is at level 0
    if (tag.startsWith("<?") || tag.startsWith("<!")) {
      lines.push(pad.repeat(level) + tag);
      continue;
    }

    // Closing tag
    if (tag.startsWith("</")) {
      level = Math.max(0, level - 1);
      lines.push(pad.repeat(level) + tag);
      continue;
    }

    // Self-closing tag (explicit /> — XML has no implicit void elements)
    if (tag.endsWith("/>")) {
      lines.push(pad.repeat(level) + tag);
      continue;
    }

    // Opening tag
    lines.push(pad.repeat(level) + tag);
    level++;
  }

  const result = lines.join("\n");
  return { output: restoreCdataBlocks(result, blocks) };
}

export function minifyXml(xml: string): XmlFormatResult {
  if (!xml.trim()) return { output: "" };

  const structureError = validateBasicStructure(xml);
  if (structureError) return { output: "", error: structureError };

  const { xml: extracted, blocks } = extractCdataBlocks(xml);
  const result = extracted
    .replace(/>\s+</g, "><")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("");

  return { output: restoreCdataBlocks(result, blocks) };
}
