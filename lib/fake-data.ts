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
