export type FieldType =
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "uuid"
  | "boolean"
  | "integer"
  | "float"
  | "date"
  | "streetAddress"
  | "city"
  | "country"
  | "company"
  | "jobTitle"
  | "sentence"
  | "paragraph"
  | "word"
  | "colorHex"
  | "ipAddress"
  | "avatarUrl";

export interface FieldTypeMeta {
  value: FieldType;
  label: string;
}

export const FIELD_TYPES: FieldTypeMeta[] = [
  { value: "fullName", label: "Full Name" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "uuid", label: "UUID" },
  { value: "boolean", label: "Boolean" },
  { value: "integer", label: "Integer (0–1000)" },
  { value: "float", label: "Float (0–1000)" },
  { value: "date", label: "Date (ISO, last 2 years)" },
  { value: "streetAddress", label: "Street Address" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "company", label: "Company" },
  { value: "jobTitle", label: "Job Title" },
  { value: "sentence", label: "Sentence" },
  { value: "paragraph", label: "Paragraph" },
  { value: "word", label: "Word" },
  { value: "colorHex", label: "Color (hex)" },
  { value: "ipAddress", label: "IP Address" },
  { value: "avatarUrl", label: "Avatar URL" },
];

export interface FieldSpec {
  id: number;
  name: string;
  type: FieldType;
}

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
  "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
  "Priya", "Wei", "Fatima", "Hiroshi", "Elena", "Kwame", "Sofia", "Ahmed", "Yuki", "Olga",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Nakamura", "Kowalski", "Andersen", "Silva", "Kim", "Patel", "Nguyen", "Muller", "Rossi", "Dubois",
];

const CITIES = [
  "New York", "London", "Tokyo", "Paris", "Berlin", "Toronto", "Sydney", "Mumbai", "Singapore", "Dubai",
  "Amsterdam", "Barcelona", "Seoul", "Austin", "Chicago", "Vancouver", "Dublin", "Lisbon", "Prague", "Warsaw",
];

const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "Brazil", "India",
  "Spain", "Italy", "Netherlands", "Sweden", "Poland", "Mexico", "South Korea", "Portugal", "Ireland", "Norway", "Egypt",
];

const COMPANIES = [
  "Acme Corp", "Globex", "Initech", "Umbrella Inc", "Stark Industries", "Wayne Enterprises", "Hooli",
  "Soylent Corp", "Massive Dynamic", "Cyberdyne Systems", "Wonka Industries", "Aperture Science",
  "Pied Piper", "Vandelay Industries", "Gringotts", "Oscorp", "Tyrell Corp", "Rekall", "Weyland-Yutani", "Monsters Inc",
];

const JOB_TITLES = [
  "Software Engineer", "Product Manager", "UX Designer", "Data Analyst", "DevOps Engineer", "QA Engineer",
  "Engineering Manager", "Marketing Lead", "Sales Executive", "Customer Success Manager", "Technical Writer",
  "Solutions Architect", "Backend Developer", "Frontend Developer", "Full Stack Developer", "Security Engineer",
];

const STREET_NAMES = [
  "Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Elm St", "Park Blvd", "Sunset Way", "Highland Rd",
  "River Rd", "Church St", "Lincoln Ave", "Washington St", "2nd St", "5th Ave", "Broadway",
];

const WORDS = [
  "system", "process", "network", "value", "data", "interface", "protocol", "module", "service",
  "instance", "pipeline", "cluster", "endpoint", "schema", "buffer", "thread", "cache", "token",
  "gateway", "queue", "index", "handler", "resolver", "middleware", "container", "registry",
];

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

type Rng = () => number;

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

function int(min: number, max: number, rng: Rng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function uuid(rng: Rng): string {
  const bytes = Array.from({ length: 16 }, () => int(0, 255, rng));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function generateField(type: FieldType, rng: Rng): unknown {
  switch (type) {
    case "fullName": return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
    case "firstName": return pick(FIRST_NAMES, rng);
    case "lastName": return pick(LAST_NAMES, rng);
    case "email": {
      const first = pick(FIRST_NAMES, rng).toLowerCase();
      const last = pick(LAST_NAMES, rng).toLowerCase();
      const domain = pick(["example.com", "mail.com", "test.dev", "demo.io"], rng);
      return `${first}.${last}${int(1, 99, rng)}@${domain}`;
    }
    case "phone": return `+1-${int(200, 999, rng)}-${int(100, 999, rng)}-${int(1000, 9999, rng)}`;
    case "uuid": return uuid(rng);
    case "boolean": return rng() > 0.5;
    case "integer": return int(0, 1000, rng);
    case "float": return Math.round(rng() * 1000 * 100) / 100;
    case "date": {
      const now = Date.now();
      const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
      const t = now - Math.floor(rng() * twoYearsMs);
      return new Date(t).toISOString();
    }
    case "streetAddress": return `${int(1, 9999, rng)} ${pick(STREET_NAMES, rng)}`;
    case "city": return pick(CITIES, rng);
    case "country": return pick(COUNTRIES, rng);
    case "company": return pick(COMPANIES, rng);
    case "jobTitle": return pick(JOB_TITLES, rng);
    case "sentence": {
      const len = int(6, 12, rng);
      const words = Array.from({ length: len }, () => pick(WORDS, rng));
      const s = words.join(" ");
      return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    }
    case "paragraph": {
      const sentences = Array.from({ length: int(3, 5, rng) }, () => generateField("sentence", rng));
      return sentences.join(" ");
    }
    case "word": return pick(WORDS, rng);
    case "colorHex": return "#" + int(0, 0xffffff, rng).toString(16).padStart(6, "0");
    case "ipAddress": return `${int(1, 255, rng)}.${int(0, 255, rng)}.${int(0, 255, rng)}.${int(1, 254, rng)}`;
    case "avatarUrl": return `https://i.pravatar.cc/150?u=${uuid(rng)}`;
    default: return null;
  }
}

export function generateRows(fields: FieldSpec[], count: number, seed?: string): Record<string, unknown>[] {
  const rng = seed ? mulberry32(hashSeed(seed)) : Math.random;
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, unknown> = {};
    fields.forEach((f) => {
      row[f.name || f.type] = generateField(f.type, rng);
    });
    rows.push(row);
  }
  return rows;
}

// ─── from a JSON Schema ──────────────────────────────────────────────────────

type Json = Record<string, unknown>;

// A property's name often says what it holds, which makes the data look real
const NAME_HINTS: [RegExp, FieldType][] = [
  [/e-?mail/i, "email"],
  [/\bip\b|ip_?address/i, "ipAddress"],
  [/first_?name/i, "firstName"],
  [/last_?name|surname/i, "lastName"],
  [/full_?name|^name$|author|customer/i, "fullName"],
  [/phone|mobile/i, "phone"],
  [/city|town/i, "city"],
  [/country/i, "country"],
  [/address|street/i, "streetAddress"],
  [/company|organi[sz]ation/i, "company"],
  [/job|position/i, "jobTitle"],
  [/colou?r/i, "colorHex"],
  [/description|bio|summary|comment|text|body/i, "sentence"],
  [/avatar|image|photo/i, "avatarUrl"],
  [/(^|_)id$|[a-z]Id$/, "uuid"],
  [/(_at|_date|^date|_time)$|[a-z](Date|At)$/, "date"],
];

const FORMAT_FIELDS: Record<string, FieldType> = { email: "email", uuid: "uuid", ipv4: "ipAddress", "date-time": "date" };

// A schema can refer to itself (trees, comments with replies). Three levels is plenty of example data
const MAX_REF_DEPTH = 3;

const isRef = (schema: unknown) => typeof schema === "object" && schema !== null && typeof (schema as Json).$ref === "string";

function fromSchema(schema: unknown, name: string, root: Json, rng: Rng, refs: number): unknown {
  if (schema === true || schema === undefined || schema === null) return generateField("word", rng);
  if (typeof schema !== "object") return null;
  let s = schema as Json;
  if (typeof s.$ref === "string") {
    if (!s.$ref.startsWith("#")) throw new Error(`Only references inside the schema are supported, not ${s.$ref}`);
    if (refs >= MAX_REF_DEPTH) return null;
    let target: unknown = root;
    for (const part of s.$ref.split("/").slice(1)) target = (target as Json | undefined)?.[part.replace(/~1/g, "/").replace(/~0/g, "~")];
    if (target === undefined) throw new Error(`The schema has no ${s.$ref}`);
    return fromSchema(target, name, root, rng, refs + 1);
  }
  if ("const" in s) return s.const;
  if (Array.isArray(s.enum) && s.enum.length) return pick(s.enum as unknown[], rng);
  for (const key of ["oneOf", "anyOf"]) {
    const options = s[key];
    if (Array.isArray(options) && options.length) return fromSchema(pick(options, rng), name, root, rng, refs);
  }
  if (Array.isArray(s.allOf)) {
    // Merge the parts, which is what allOf almost always means in practice
    s = (s.allOf as Json[]).reduce<Json>(
      (acc, part) => ({ ...acc, ...part, properties: { ...(acc.properties as Json), ...(part.properties as Json) }, required: [...((acc.required as string[]) ?? []), ...((part.required as string[]) ?? [])] }),
      { ...s, allOf: undefined }
    );
  }

  let type = s.type as string | string[] | undefined;
  if (Array.isArray(type)) {
    const real = type.filter((t) => t !== "null");
    // Mostly real values, some nulls, when null is allowed
    if (real.length < type.length && rng() < 0.15) return null;
    type = real.length ? pick(real, rng) : "null";
  }
  if (!type) type = s.properties ? "object" : s.items ? "array" : "string";

  switch (type) {
    case "null":
      return null;
    case "boolean":
      return rng() > 0.5;
    case "integer":
    case "number": {
      const nudge = type === "integer" ? 1 : 0.01;
      const min = typeof s.minimum === "number" ? s.minimum : typeof s.exclusiveMinimum === "number" ? s.exclusiveMinimum + nudge : null;
      const max = typeof s.maximum === "number" ? s.maximum : typeof s.exclusiveMaximum === "number" ? s.exclusiveMaximum - nudge : null;
      const lo = min ?? (max !== null ? Math.min(0, max - 1000) : 0);
      const hi = max ?? lo + 1000;
      const step = typeof s.multipleOf === "number" && s.multipleOf > 0 ? s.multipleOf : type === "integer" ? 1 : 0;
      if (step) {
        const first = Math.ceil(lo / step) * step;
        const last = Math.floor(hi / step) * step;
        return first + step * int(0, Math.max(0, Math.round((last - first) / step)), rng);
      }
      return Math.round((lo + rng() * (hi - lo)) * 100) / 100;
    }
    case "array": {
      if (isRef(s.items) && refs >= MAX_REF_DEPTH) return [];
      const min = typeof s.minItems === "number" ? s.minItems : 1;
      const max = typeof s.maxItems === "number" ? s.maxItems : Math.max(min, 3);
      const singular = name.replace(/s$/, "");
      return Array.from({ length: int(min, Math.min(max, min + 10), rng) }, () => fromSchema(s.items ?? {}, singular, root, rng, refs));
    }
    case "object": {
      const props = (s.properties ?? {}) as Json;
      const required = Array.isArray(s.required) ? (s.required as string[]) : [];
      const out: Json = {};
      for (const [key, value] of Object.entries(props)) {
        // Optional properties are sometimes left out, as real data does
        if (!required.includes(key) && (rng() < 0.2 || (isRef(value) && refs >= MAX_REF_DEPTH))) continue;
        out[key] = fromSchema(value, key, root, rng, refs);
      }
      return out;
    }
    default: {
      const format = typeof s.format === "string" ? s.format : "";
      if (format === "date") return String(generateField("date", rng)).slice(0, 10);
      if (format === "time") return `${String(generateField("date", rng)).slice(11, 19)}Z`;
      if (format === "uri" || format === "url") return `https://example.com/${pick(WORDS, rng)}/${int(1, 9999, rng)}`;
      if (format === "hostname") return `${pick(WORDS, rng)}.example.com`;
      if (format === "ipv6") return `2001:db8::${int(1, 65535, rng).toString(16)}`;
      if (FORMAT_FIELDS[format]) return generateField(FORMAT_FIELDS[format], rng);
      let text = String(generateField(NAME_HINTS.find(([re]) => re.test(name))?.[1] ?? "word", rng));
      if (typeof s.minLength === "number") while (text.length < s.minLength) text += ` ${pick(WORDS, rng)}`;
      if (typeof s.maxLength === "number") text = text.slice(0, s.maxLength);
      return text;
    }
  }
}

/** Rows that follow a JSON Schema. A `pattern` can't be honored from a random source, so it's reported */
export function generateFromSchema(schemaText: string, count: number, seed?: string): { rows: unknown[]; unsupported: string[] } {
  const schema = JSON.parse(schemaText) as Json;
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) throw new Error("A JSON Schema is a JSON object, like { \"type\": \"object\", … }");
  const rng = seed ? mulberry32(hashSeed(seed)) : Math.random;
  const rows = Array.from({ length: count }, () => fromSchema(schema, "", schema, rng, 0));
  return { rows, unsupported: /"pattern"\s*:\s*"/.test(schemaText) ? ["pattern"] : [] };
}

// ─── SQL ─────────────────────────────────────────────────────────────────────

export type SqlDialect = "postgres" | "mysql" | "sqlite";

type ColumnKind = "int" | "big" | "num" | "bool" | "time" | "date" | "uuid" | "json" | "text";

const COLUMN_TYPES: Record<SqlDialect, Record<ColumnKind, string>> = {
  postgres: { int: "INTEGER", big: "BIGINT", num: "NUMERIC", bool: "BOOLEAN", time: "TIMESTAMPTZ", date: "DATE", uuid: "UUID", json: "JSONB", text: "TEXT" },
  mysql: { int: "INT", big: "BIGINT", num: "DOUBLE", bool: "TINYINT(1)", time: "DATETIME", date: "DATE", uuid: "CHAR(36)", json: "JSON", text: "TEXT" },
  sqlite: { int: "INTEGER", big: "INTEGER", num: "REAL", bool: "INTEGER", time: "TEXT", date: "TEXT", uuid: "TEXT", json: "TEXT", text: "TEXT" },
};

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The narrowest kind of column that holds every value in it */
function columnKind(values: unknown[]): ColumnKind {
  const seen = values.filter((v) => v !== null && v !== undefined);
  const all = (test: (v: unknown) => boolean) => seen.every(test);
  const text = (re: RegExp) => all((v) => typeof v === "string" && re.test(v));
  if (!seen.length) return "text";
  if (seen.some((v) => typeof v === "object")) return "json";
  if (all((v) => typeof v === "boolean")) return "bool";
  if (all((v) => typeof v === "number")) {
    if (!all((v) => Number.isInteger(v))) return "num";
    return all((v) => Math.abs(v as number) < 2147483648) ? "int" : "big";
  }
  if (text(UUID)) return "uuid";
  if (text(ISO_DATETIME)) return "time";
  if (text(ISO_DATE)) return "date";
  return "text";
}

const quoteId = (name: string, d: SqlDialect) => (d === "mysql" ? `\`${name.replace(/`/g, "``")}\`` : `"${name.replace(/"/g, '""')}"`);

function sqlValue(value: unknown, kind: ColumnKind, d: SqlDialect): string {
  if (value === null || value === undefined) return "NULL";
  if (kind === "int" || kind === "big" || kind === "num") return String(value);
  if (kind === "bool") return d === "postgres" ? (value ? "TRUE" : "FALSE") : value ? "1" : "0";
  // A column of mixed values is quoted throughout, since a database won't mix types within VALUES
  let text = kind === "json" ? JSON.stringify(value) : String(value);
  // MySQL's DATETIME rejects the ISO form in strict mode
  if (d === "mysql" && kind === "time") text = text.slice(0, 19).replace("T", " ");
  // In MySQL a backslash escapes too, unless NO_BACKSLASH_ESCAPES is on
  if (d === "mysql") text = text.replace(/\\/g, "\\\\");
  return `'${text.replace(/'/g, "''")}'`;
}

/** INSERT statements (batched, as real seed files are), optionally with the CREATE TABLE before them */
export function buildSql(rows: unknown[], table: string, dialect: SqlDialect, opts: { createTable?: boolean; batch?: number } = {}): string {
  const records = rows.filter((r): r is Json => typeof r === "object" && r !== null && !Array.isArray(r));
  if (!records.length) return "";
  const columns = Array.from(new Set(records.flatMap((r) => Object.keys(r))));
  const kinds = columns.map((c) => columnKind(records.map((r) => r[c])));
  const name = quoteId(table.trim() || "mock_data", dialect);
  const out: string[] = [];
  if (opts.createTable) {
    const defs = columns.map((c, i) => `  ${quoteId(c, dialect)} ${COLUMN_TYPES[dialect][kinds[i]]}`);
    out.push(`CREATE TABLE ${name} (\n${defs.join(",\n")}\n);`, "");
  }
  const cols = columns.map((c) => quoteId(c, dialect)).join(", ");
  const batch = Math.max(1, opts.batch ?? 500);
  for (let i = 0; i < records.length; i += batch) {
    const values = records.slice(i, i + batch).map((r) => `  (${columns.map((c, j) => sqlValue(r[c], kinds[j], dialect)).join(", ")})`);
    out.push(`INSERT INTO ${name} (${cols}) VALUES\n${values.join(",\n")};`);
  }
  return out.join("\n");
}
