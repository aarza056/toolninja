// Follows the common xml-js-style convention: attributes become "@name" keys, direct text
// content becomes a "#text" key (or the bare string, for a pure-text leaf with no attributes),
// and repeated child tag names become an array. The top-level JSON object always has exactly one
// key — the root element's tag name — so the conversion round-trips in both directions.

function getDirectText(el: Element): string {
  let text = "";
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
      text += node.textContent ?? "";
    }
  }
  return text.trim();
}

function elementToValue(el: Element): unknown {
  const attrs = Array.from(el.attributes);
  const children = Array.from(el.children);
  const directText = getDirectText(el);

  if (attrs.length === 0 && children.length === 0) {
    return directText;
  }

  const obj: Record<string, unknown> = {};
  for (const a of attrs) obj[`@${a.name}`] = a.value;

  const order: string[] = [];
  const grouped = new Map<string, unknown[]>();
  for (const child of children) {
    const tag = child.tagName;
    if (!grouped.has(tag)) {
      grouped.set(tag, []);
      order.push(tag);
    }
    grouped.get(tag)!.push(elementToValue(child));
  }
  for (const tag of order) {
    const values = grouped.get(tag)!;
    obj[tag] = values.length === 1 ? values[0] : values;
  }

  if (directText) obj["#text"] = directText;
  return obj;
}

export function xmlToJson(xmlString: string): { json: Record<string, unknown> | null; error: string | null } {
  if (!xmlString.trim()) return { json: null, error: null };
  const doc = new DOMParser().parseFromString(xmlString, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return { json: null, error: parseError.textContent?.trim() ?? "Invalid XML" };

  const root = doc.documentElement;
  if (!root) return { json: null, error: "No root element found" };
  return { json: { [root.tagName]: elementToValue(root) }, error: null };
}

function escapeXmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXmlAttr(s: string): string {
  return escapeXmlText(s).replace(/"/g, "&quot;");
}

function buildElement(name: string, value: unknown, depth: number): string {
  const indent = "  ".repeat(depth);

  if (Array.isArray(value)) {
    return value.map((v) => buildElement(name, v, depth)).join("\n");
  }
  if (value === null || value === undefined || value === "") {
    return `${indent}<${name}/>`;
  }
  if (typeof value !== "object") {
    return `${indent}<${name}>${escapeXmlText(String(value))}</${name}>`;
  }

  const obj = value as Record<string, unknown>;
  const attrs: string[] = [];
  const childLines: string[] = [];
  let text: string | null = null;

  for (const [key, v] of Object.entries(obj)) {
    if (key.startsWith("@")) {
      attrs.push(`${key.slice(1)}="${escapeXmlAttr(String(v))}"`);
    } else if (key === "#text") {
      text = String(v);
    } else if (Array.isArray(v)) {
      for (const item of v) childLines.push(buildElement(key, item, depth + 1));
    } else {
      childLines.push(buildElement(key, v, depth + 1));
    }
  }

  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  if (childLines.length === 0 && text === null) return `${indent}<${name}${attrStr}/>`;
  if (childLines.length === 0 && text !== null) return `${indent}<${name}${attrStr}>${escapeXmlText(text)}</${name}>`;

  const textLine = text !== null ? `\n${"  ".repeat(depth + 1)}${escapeXmlText(text)}` : "";
  return `${indent}<${name}${attrStr}>\n${childLines.join("\n")}${textLine}\n${indent}</${name}>`;
}

export function jsonToXml(data: unknown): string {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Top-level JSON must be an object with exactly one key — the root element's tag name.");
  }
  const keys = Object.keys(data as object);
  if (keys.length !== 1) {
    throw new Error(`Top-level JSON must have exactly one key (the root element name) — found ${keys.length}.`);
  }
  const rootName = keys[0];
  if (!/^[a-zA-Z_][\w.-]*$/.test(rootName)) {
    throw new Error(`"${rootName}" isn't a valid XML element name.`);
  }
  const rootValue = (data as Record<string, unknown>)[rootName];
  return `<?xml version="1.0" encoding="UTF-8"?>\n${buildElement(rootName, rootValue, 0)}`;
}
