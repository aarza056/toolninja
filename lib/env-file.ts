export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

export interface ParseEnvResult {
  entries: EnvEntry[];
  duplicates: string[];
}

export function parseEnv(text: string): ParseEnvResult {
  const lines = text.split(/\r?\n/);
  const entries: EnvEntry[] = [];
  const seen = new Set<string>();
  const duplicateSet = new Set<string>();

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    const withoutExport = line.replace(/^export\s+/, "");
    const eqIdx = withoutExport.indexOf("=");
    if (eqIdx === -1) return;

    const key = withoutExport.slice(0, eqIdx).trim();
    if (!key) return;
    let value = withoutExport.slice(eqIdx + 1).trim();

    const isQuoted = /^['"]/.test(value);
    if (!isQuoted) {
      const hashIdx = value.indexOf(" #");
      if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();
    }
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }

    if (seen.has(key)) duplicateSet.add(key);
    seen.add(key);
    entries.push({ key, value, line: i + 1 });
  });

  return { entries, duplicates: Array.from(duplicateSet) };
}

export function envToJson(text: string): string {
  const { entries } = parseEnv(text);
  const obj: Record<string, string> = {};
  entries.forEach((e) => {
    obj[e.key] = e.value;
  });
  return JSON.stringify(obj, null, 2);
}

function needsQuoting(value: string): boolean {
  return /[\s#"']/.test(value) || value === "";
}

export function jsonToEnv(json: string): string {
  const obj = JSON.parse(json);
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new Error("JSON must be a flat object of key-value pairs");
  }
  const lines = Object.entries(obj).map(([k, v]) => {
    const val = typeof v === "string" ? v : JSON.stringify(v);
    return needsQuoting(val) ? `${k}="${val.replace(/"/g, '\\"')}"` : `${k}=${val}`;
  });
  return lines.join("\n") + (lines.length ? "\n" : "");
}

export function generateExample(text: string): string {
  const { entries } = parseEnv(text);
  return entries.map((e) => `${e.key}=`).join("\n") + (entries.length ? "\n" : "");
}

export function envToDockerRunFlags(text: string): string {
  const { entries } = parseEnv(text);
  if (entries.length === 0) return "";
  return entries.map((e) => `-e ${e.key}="${e.value.replace(/"/g, '\\"')}"`).join(" \\\n  ");
}

// Keys matching this pattern are routed to a Kubernetes Secret instead of a ConfigMap — a
// simple, common heuristic (not a security scan) so obviously sensitive values don't land in
// plain-text ConfigMap YAML by default.
const SECRET_KEY_PATTERN = /(SECRET|PASSWORD|PASSWD|TOKEN|_KEY$|^KEY|PRIVATE|CREDENTIAL|AUTH)/i;

export function envToKubernetesYaml(text: string, name = "app"): string {
  const { entries } = parseEnv(text);
  if (entries.length === 0) return "";

  const secrets = entries.filter((e) => SECRET_KEY_PATTERN.test(e.key));
  const configs = entries.filter((e) => !SECRET_KEY_PATTERN.test(e.key));
  const parts: string[] = [];

  if (configs.length > 0) {
    const lines = configs.map((e) => `  ${e.key}: "${e.value.replace(/"/g, '\\"')}"`).join("\n");
    parts.push(`apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${name}-config\ndata:\n${lines}`);
  }

  if (secrets.length > 0) {
    const lines = secrets.map((e) => `  ${e.key}: "${e.value.replace(/"/g, '\\"')}"`).join("\n");
    parts.push(`apiVersion: v1\nkind: Secret\nmetadata:\n  name: ${name}-secret\ntype: Opaque\nstringData:\n${lines}`);
  }

  return parts.join("\n---\n") + "\n";
}
