import type { FieldSpec, SqlDialect } from "@/lib/fake-data";

// The /tools/fake-data-generator/<format> pages: one per database or file format people search for
// ("postgres fake data generator", "csv test data generator"). Each opens the generator set up for
// that output, with notes and questions specific to it.

export type FakeFormat = "json" | "ndjson" | "csv" | "sql";

export interface FakeDataPage {
  slug: string;
  name: string;
  format: FakeFormat;
  dialect?: SqlDialect;
  table: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  fields: FieldSpec[];
  /** How to load the output, shown under the generator */
  load: { label: string; code: string }[];
  notes: string[];
  faq: { q: string; a: string }[];
}

const USERS: FieldSpec[] = [
  { id: 1, name: "id", type: "uuid" },
  { id: 2, name: "full_name", type: "fullName" },
  { id: 3, name: "email", type: "email" },
  { id: 4, name: "city", type: "city" },
  { id: 5, name: "is_active", type: "boolean" },
  { id: 6, name: "created_at", type: "date" },
];

const CUSTOMERS: FieldSpec[] = [
  { id: 1, name: "id", type: "uuid" },
  { id: 2, name: "first_name", type: "firstName" },
  { id: 3, name: "last_name", type: "lastName" },
  { id: 4, name: "email", type: "email" },
  { id: 5, name: "company", type: "company" },
  { id: 6, name: "country", type: "country" },
  { id: 7, name: "lifetime_value", type: "float" },
];

export const FAKE_DATA_PAGES: FakeDataPage[] = [
  {
    slug: "postgresql",
    name: "PostgreSQL",
    format: "sql",
    dialect: "postgres",
    table: "users",
    title: "PostgreSQL Fake Data Generator — INSERT Statements",
    description: "Generate realistic fake data for PostgreSQL: a CREATE TABLE with uuid, boolean and timestamptz columns plus batched INSERT statements, up to 10,000 rows. Free.",
    heading: "PostgreSQL Fake Data Generator",
    intro: "Generate dummy rows as PostgreSQL INSERT statements, with a matching CREATE TABLE. Pick fields or paste a JSON Schema.",
    fields: USERS,
    load: [
      { label: "psql", code: "psql -d mydb -f mock-data.sql" },
      { label: "Docker", code: "docker exec -i my-postgres psql -U postgres -d mydb < mock-data.sql" },
    ],
    notes: [
      "Columns get native types: UUID, BOOLEAN, INTEGER, NUMERIC, TIMESTAMPTZ, and JSONB for nested objects and arrays.",
      "Identifiers are double-quoted and strings use standard single-quote escaping, so names like \"order\" and values like O'Brien load without errors.",
      "Rows are inserted 500 per statement, which loads thousands of rows in well under a second.",
      "With a seed, the same settings give the same data every time, which is useful for repeatable tests.",
    ],
    faq: [
      {
        q: "How do I load the generated SQL into PostgreSQL?",
        a: "Download the file and run psql -d yourdb -f mock-data.sql, or paste it into pgAdmin, DBeaver or the query tool of your hosting provider (Supabase, Neon, RDS).",
      },
      {
        q: "Can PostgreSQL generate fake data itself?",
        a: "For simple numbers and series, yes: INSERT … SELECT with generate_series() and random(). For realistic names, emails and addresses, a generator like this one is quicker, and the postgresql_faker extension exists if you need it inside the database.",
      },
      {
        q: "How do I insert into a table that already exists?",
        a: "Untick CREATE TABLE and set the table name; the column names come from your field names, so match them to the existing table.",
      },
    ],
  },
  {
    slug: "mysql",
    name: "MySQL",
    format: "sql",
    dialect: "mysql",
    table: "customers",
    title: "MySQL Fake Data Generator — Dummy INSERT Data",
    description: "Generate fake data for MySQL and MariaDB: a CREATE TABLE and batched INSERT statements with names, emails, companies and dates. Up to 10,000 rows, free.",
    heading: "MySQL Fake Data Generator",
    intro: "Generate dummy rows as MySQL / MariaDB INSERT statements, with a matching CREATE TABLE. Pick fields or paste a JSON Schema.",
    fields: CUSTOMERS,
    load: [
      { label: "mysql", code: "mysql -u root -p mydb < mock-data.sql" },
      { label: "Docker", code: "docker exec -i my-mysql mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" mydb < mock-data.sql" },
    ],
    notes: [
      "Identifiers are quoted with backticks and strings are escaped for MySQL's default sql_mode.",
      "UUIDs are stored as CHAR(36), booleans as TINYINT(1), decimals as DOUBLE, nested values as JSON columns, and timestamps as DATETIME.",
      "The same file loads into MariaDB.",
      "Rows are batched, 500 per INSERT, to stay well under max_allowed_packet.",
    ],
    faq: [
      {
        q: "How do I import the file into MySQL?",
        a: "Run mysql -u user -p yourdb < mock-data.sql, or use MySQL Workbench's File → Run SQL Script, or phpMyAdmin's Import tab.",
      },
      {
        q: "Does it work with MariaDB and PlanetScale?",
        a: "Yes. The statements use syntax both MySQL 8 and MariaDB accept. On PlanetScale or Vitess, untick CREATE TABLE if your schema is managed by migrations.",
      },
      {
        q: "Why are UUIDs CHAR(36) and not BINARY(16)?",
        a: "CHAR(36) is readable and works everywhere. For large tables, convert with UUID_TO_BIN() into a BINARY(16) column to save space.",
      },
    ],
  },
  {
    slug: "sqlite",
    name: "SQLite",
    format: "sql",
    dialect: "sqlite",
    table: "users",
    title: "SQLite Fake Data Generator — Test Data as SQL",
    description: "Generate fake data for SQLite: CREATE TABLE and INSERT statements with realistic names, emails and dates, ready for sqlite3, Prisma or Drizzle tests. Free.",
    heading: "SQLite Fake Data Generator",
    intro: "Generate dummy rows as SQLite INSERT statements, with a matching CREATE TABLE. Pick fields or paste a JSON Schema.",
    fields: USERS,
    load: [
      { label: "sqlite3", code: "sqlite3 app.db < mock-data.sql" },
      { label: "Node", code: "import { DatabaseSync } from \"node:sqlite\";\nimport { readFileSync } from \"node:fs\";\nnew DatabaseSync(\"app.db\").exec(readFileSync(\"mock-data.sql\", \"utf8\"));" },
    ],
    notes: [
      "Columns use SQLite's type affinities: TEXT, INTEGER, REAL, and TEXT holding JSON for nested values.",
      "Booleans become 0 and 1, and dates ISO 8601 text, which SQLite's date functions read directly.",
      "The statements are valid for sqlite3, better-sqlite3, node:sqlite, Python's sqlite3 module and libSQL / Turso.",
    ],
    faq: [
      {
        q: "How do I load the SQL into an SQLite database?",
        a: "Run sqlite3 app.db < mock-data.sql. The database file is created if it doesn't exist.",
      },
      {
        q: "Can I use this for seeding tests?",
        a: "Yes. Set a seed so every test run gets the same rows, then execute the file in your test setup, or generate JSON and insert through your ORM.",
      },
    ],
  },
  {
    slug: "csv",
    name: "CSV",
    format: "csv",
    table: "customers",
    title: "CSV Test Data Generator — Fake CSV Files Online",
    description: "Generate a CSV file of fake test data: names, emails, companies, countries and amounts, up to 10,000 rows, with a header row. Opens in Excel and Google Sheets.",
    heading: "CSV Test Data Generator",
    intro: "Generate a CSV of realistic fake data, with a header row, ready for Excel, Google Sheets or an import test.",
    fields: CUSTOMERS,
    load: [
      { label: "PostgreSQL", code: "\\copy customers FROM 'mock-data.csv' WITH (FORMAT csv, HEADER true)" },
      { label: "Python", code: "import pandas as pd\ndf = pd.read_csv(\"mock-data.csv\")" },
    ],
    notes: [
      "The file follows RFC 4180: commas between values, quotes around values that contain commas, quotes or line breaks.",
      "The first row holds the field names, so spreadsheet and database imports can map the columns.",
      "Nested values from a JSON Schema are written into the cell as JSON.",
    ],
    faq: [
      {
        q: "How big a CSV can I generate?",
        a: "Up to 10,000 rows at a time, generated in your browser. For more, generate several files with different seeds.",
      },
      {
        q: "Will the CSV open correctly in Excel?",
        a: "Yes. If accented characters look wrong in older Excel versions, use Data → From Text/CSV and choose UTF-8.",
      },
      {
        q: "How do I convert the CSV to JSON afterwards?",
        a: "Pick JSON here instead, or use the CSV to JSON converter, which also turns numbers and true/false into real types.",
      },
    ],
  },
  {
    slug: "json",
    name: "JSON",
    format: "json",
    table: "users",
    title: "JSON Mock Data Generator — Fake JSON for APIs",
    description: "Generate mock JSON data for API tests and front-end prototypes: arrays of realistic users, or rows that match your JSON Schema. Up to 10,000 records, free.",
    heading: "JSON Mock Data Generator",
    intro: "Generate an array of realistic fake records as JSON or NDJSON. Pick fields, or paste a JSON Schema and get data that matches it.",
    fields: USERS,
    load: [
      { label: "json-server", code: "npx json-server --watch db.json  # wrap the array as { \"users\": [...] }" },
      { label: "fetch mock", code: "const users = await (await fetch(\"/mock-data.json\")).json();" },
    ],
    notes: [
      "From a JSON Schema, the data follows type, format, enum, minimum and maximum, string lengths, required properties and $refs.",
      "NDJSON writes one record per line, the format for bulk APIs, log pipelines and BigQuery loads.",
      "A seed makes the output repeatable, so snapshot tests stay stable.",
    ],
    faq: [
      {
        q: "Can I generate JSON that matches my schema?",
        a: "Yes. Switch to From JSON Schema and paste it. Property names like email, city or created_at also get realistic values.",
      },
      {
        q: "How do I serve the data as a fake REST API?",
        a: "Save it as db.json in the shape { \"users\": [ ... ] } and run npx json-server db.json. You get GET, POST, PUT and DELETE on /users.",
      },
    ],
  },
];

export const fakeDataPage = (slug: string) => FAKE_DATA_PAGES.find((p) => p.slug === slug);
