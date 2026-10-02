const ATTR_OVERRIDES: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  crossorigin: "crossOrigin",
};

function attrToJsxProp(name: string): string {
  // JSX keeps data-* and aria-* attributes exactly as written — React special-cases them
  // rather than requiring the usual camelCase DOM-property form.
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  if (ATTR_OVERRIDES[name]) return ATTR_OVERRIDES[name];
  // Covers both kebab-case (stroke-width) and namespaced (xlink:href) attribute names —
  // both use a single non-alphanumeric separator before the next word.
  return name.replace(/[-:]([a-zA-Z])/g, (_, c: string) => c.toUpperCase());
}

function formatAttrValue(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return `{${value}}`;
  return `"${value.replace(/"/g, "&quot;")}"`;
}

function elementToJsx(el: Element, indent: number, isRoot: boolean): string {
  const pad = " ".repeat(indent);
  const attrs = Array.from(el.attributes)
    .filter((a) => a.name !== "xmlns" && !a.name.startsWith("xmlns:"))
    .map((a) => `${attrToJsxProp(a.name)}=${formatAttrValue(a.value)}`)
    .join(" ");
  const propsSpread = isRoot ? " {...props}" : "";
  const openTag = `<${el.tagName}${attrs ? " " + attrs : ""}${propsSpread}`;

  const children = Array.from(el.children);
  if (children.length === 0) {
    return `${pad}${openTag} />`;
  }
  const childrenJsx = children.map((c) => elementToJsx(c, indent + 2, false)).join("\n");
  return `${pad}${openTag}>\n${childrenJsx}\n${pad}</${el.tagName}>`;
}

export function sanitizeComponentName(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, " ").trim();
  const pascal = cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const name = pascal || "Icon";
  return /^[A-Za-z]/.test(name) ? name : `Icon${name}`;
}

/** Converts raw SVG markup into a self-contained React component — attribute names translated
 * to their JSX equivalents (camelCase, with the data- and aria- prefixed, and xlink: namespaced,
 * exceptions handled correctly), xmlns declarations dropped (unnecessary noise in JSX), and
 * {...props} spread onto the root svg element so size, color, and event handlers can still be
 * overridden by the caller. */
export function svgToJsx(svgMarkup: string, componentName: string, typescript: boolean): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup.trim(), "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Couldn't parse this as valid SVG/XML markup.");
  }

  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("The root element isn't <svg> — paste the full SVG markup, starting with <svg ...>.");
  }

  const name = sanitizeComponentName(componentName);
  const jsx = elementToJsx(root, 2, true);
  const propsType = typescript ? ": React.SVGProps<SVGSVGElement>" : "";

  return `function ${name}(props${propsType}) {\n  return (\n${jsx}\n  );\n}\n\nexport default ${name};`;
}
