export function buildCurlCommand(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string
): string {
  const parts = [`curl -X ${method} "${url}"`];
  Object.entries(headers).forEach(([k, v]) => {
    parts.push(`-H "${k}: ${v}"`);
  });
  if (body) {
    parts.push(`-d '${body.replace(/'/g, `'\\''`)}'`);
  }
  return parts.join(" \\\n  ");
}

export function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
