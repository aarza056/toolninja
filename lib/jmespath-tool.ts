import { search } from "jmespath";

// JMESPath, the query language of the AWS CLI's --query and the Azure CLI's --query, evaluated with
// the reference JavaScript implementation, plus the sample data, examples and command-line forms
// the tester shows.

export interface JmesResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  /** The data was parsed from something other than strict JSON */
  note?: string;
}

export function parseJsonInput(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid JSON";
    return { ok: false, error: `The data isn't valid JSON: ${msg}` };
  }
}

/** jmespath.js reports errors as "Expected X, got: Y" with a token position; make them readable */
export function friendlyError(err: unknown, query: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  if (/Unknown function/i.test(raw)) return `${raw}. Function names are case-sensitive (e.g. length, sort_by, to_string).`;
  if (/invalid-type|invalid type/i.test(raw) || name === "invalid-type") return `${raw}. Check the argument types: sort_by and max_by need an &expression, and string functions need strings.`;
  if (/^\s*$/.test(query)) return "Enter a query.";
  if (/Unexpected token|Expected|Unknown character|Invalid/.test(raw)) {
    const hint = /"/.test(query) && !/`/.test(query) ? " In JMESPath, \"double quotes\" name a field; write string values in 'single quotes' (or `backtick` JSON literals)." : "";
    return `${raw}.${hint}`;
  }
  return raw;
}

export function runJmes(query: string, data: unknown): JmesResult {
  if (!query.trim()) return { ok: true, value: data };
  try {
    return { ok: true, value: search(data as never, query) };
  } catch (e) {
    return { ok: false, error: friendlyError(e, query) };
  }
}

/** A query quoted for a POSIX shell (single quotes, with embedded ones escaped) */
export function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** The AWS CLI, Azure CLI and jp command lines for a query */
export function cliCommands(query: string): { label: string; code: string }[] {
  const q = query.trim() || "@";
  return [
    { label: "AWS CLI", code: `aws ec2 describe-instances --query ${shellQuote(q)} --output json` },
    { label: "Azure CLI", code: `az vm list --query ${shellQuote(q)} --output json` },
    { label: "jp (JMESPath CLI)", code: `jp -f data.json ${shellQuote(q)}` },
    { label: "Python (jmespath)", code: `import jmespath\nresult = jmespath.search(${JSON.stringify(q)}, data)` },
    { label: "JavaScript (jmespath)", code: `import { search } from "jmespath";\nconst result = search(data, ${JSON.stringify(q)});` },
  ];
}

export const SAMPLE_EC2 = {
  Reservations: [
    {
      ReservationId: "r-0a1b2c3d4e5f60718",
      Instances: [
        {
          InstanceId: "i-0123456789abcdef0",
          InstanceType: "t3.micro",
          State: { Code: 16, Name: "running" },
          LaunchTime: "2026-09-02T08:14:00+00:00",
          PrivateIpAddress: "10.0.1.15",
          PublicIpAddress: "203.0.113.10",
          Placement: { AvailabilityZone: "us-east-1a" },
          Tags: [
            { Key: "Name", Value: "web-1" },
            { Key: "Environment", Value: "production" },
          ],
          SecurityGroups: [{ GroupId: "sg-0aa11bb22cc33dd44", GroupName: "web" }],
        },
        {
          InstanceId: "i-0fedcba9876543210",
          InstanceType: "t3.large",
          State: { Code: 80, Name: "stopped" },
          LaunchTime: "2026-06-21T17:40:00+00:00",
          PrivateIpAddress: "10.0.2.31",
          Placement: { AvailabilityZone: "us-east-1b" },
          Tags: [
            { Key: "Name", Value: "worker-1" },
            { Key: "Environment", Value: "staging" },
          ],
          SecurityGroups: [{ GroupId: "sg-0bb22cc33dd44ee55", GroupName: "workers" }],
        },
      ],
    },
    {
      ReservationId: "r-0f9e8d7c6b5a40312",
      Instances: [
        {
          InstanceId: "i-0a0b0c0d0e0f01234",
          InstanceType: "m7g.xlarge",
          State: { Code: 16, Name: "running" },
          LaunchTime: "2026-10-30T11:05:00+00:00",
          PrivateIpAddress: "10.0.3.7",
          Placement: { AvailabilityZone: "us-east-1a" },
          Tags: [
            { Key: "Name", Value: "db-1" },
            { Key: "Environment", Value: "production" },
          ],
          SecurityGroups: [
            { GroupId: "sg-0cc33dd44ee55ff66", GroupName: "db" },
            { GroupId: "sg-0aa11bb22cc33dd44", GroupName: "web" },
          ],
        },
      ],
    },
  ],
};

export const SAMPLE_PEOPLE = {
  people: [
    { name: "Ada", age: 36, city: "London", skills: ["math", "engines"] },
    { name: "Grace", age: 45, city: "New York", skills: ["compilers", "cobol"] },
    { name: "Linus", age: 28, city: "Helsinki", skills: ["kernels", "git"] },
    { name: "Margaret", age: 33, city: "Boston", skills: ["apollo", "software"] },
  ],
  meta: { total: 4, source: "example" },
};

export interface JmesExample {
  label: string;
  query: string;
  data: "ec2" | "people";
}

export const JMES_EXAMPLES: JmesExample[] = [
  { label: "All instance IDs", query: "Reservations[].Instances[].InstanceId", data: "ec2" },
  { label: "Running instances only", query: "Reservations[].Instances[?State.Name=='running'].InstanceId[]", data: "ec2" },
  { label: "ID, type and Name tag as objects", query: "Reservations[].Instances[].{ID: InstanceId, Type: InstanceType, Name: Tags[?Key=='Name'] | [0].Value}", data: "ec2" },
  { label: "Rows for --output table", query: "Reservations[].Instances[].[InstanceId, State.Name, Placement.AvailabilityZone]", data: "ec2" },
  { label: "Instances tagged production", query: "Reservations[].Instances[?Tags[?Key=='Environment' && Value=='production']].InstanceId[]", data: "ec2" },
  { label: "Newest instance", query: "sort_by(Reservations[].Instances[], &LaunchTime)[-1].InstanceId", data: "ec2" },
  { label: "Count instances", query: "length(Reservations[].Instances[])", data: "ec2" },
  { label: "Every security group name, sorted", query: "sort(Reservations[].Instances[].SecurityGroups[].GroupName)", data: "ec2" },
  { label: "Names of people over 30", query: "people[?age > `30`].name", data: "people" },
  { label: "Oldest person", query: "max_by(people, &age).name", data: "people" },
  { label: "Sorted by name", query: "sort_by(people, &name)[].name", data: "people" },
  { label: "Who knows git?", query: "people[?contains(skills, 'git')].name", data: "people" },
  { label: "Join into one string", query: "join(', ', people[].name)", data: "people" },
  { label: "Average age", query: "avg(people[].age)", data: "people" },
];

export interface JmesFunction {
  name: string;
  signature: string;
  description: string;
}

export const JMES_FUNCTIONS: JmesFunction[] = [
  { name: "abs", signature: "abs(number)", description: "Absolute value." },
  { name: "avg", signature: "avg(array[number])", description: "Average of the numbers." },
  { name: "ceil", signature: "ceil(number)", description: "Rounds up." },
  { name: "contains", signature: "contains(array|string, any)", description: "Whether the array has the item, or the string has the substring." },
  { name: "ends_with", signature: "ends_with(string, suffix)", description: "Whether the string ends with the suffix." },
  { name: "floor", signature: "floor(number)", description: "Rounds down." },
  { name: "join", signature: "join(glue, array[string])", description: "Joins strings with the glue between them." },
  { name: "keys", signature: "keys(object)", description: "The object's keys." },
  { name: "length", signature: "length(string|array|object)", description: "Characters, items or keys." },
  { name: "map", signature: "map(&expr, array)", description: "Applies the expression to every item." },
  { name: "max", signature: "max(array[number|string])", description: "The largest value." },
  { name: "max_by", signature: "max_by(array, &expr)", description: "The item whose expression value is largest." },
  { name: "merge", signature: "merge(object, ...)", description: "Merges objects; later keys win." },
  { name: "min", signature: "min(array[number|string])", description: "The smallest value." },
  { name: "min_by", signature: "min_by(array, &expr)", description: "The item whose expression value is smallest." },
  { name: "not_null", signature: "not_null(any, ...)", description: "The first argument that isn't null." },
  { name: "reverse", signature: "reverse(array|string)", description: "Reverses the order." },
  { name: "sort", signature: "sort(array[number|string])", description: "Sorts numbers or strings." },
  { name: "sort_by", signature: "sort_by(array, &expr)", description: "Sorts items by the expression's value." },
  { name: "starts_with", signature: "starts_with(string, prefix)", description: "Whether the string starts with the prefix." },
  { name: "sum", signature: "sum(array[number])", description: "Adds the numbers." },
  { name: "to_array", signature: "to_array(any)", description: "Wraps a value in an array, unless it already is one." },
  { name: "to_number", signature: "to_number(any)", description: "Converts a string to a number (null if it can't)." },
  { name: "to_string", signature: "to_string(any)", description: "The value as a string (JSON for objects and arrays)." },
  { name: "type", signature: "type(any)", description: "number, string, boolean, array, object or null." },
  { name: "values", signature: "values(object)", description: "The object's values." },
];

/** The JMESPath ↔ JSONPath forms people look up most */
export const JSONPATH_EQUIVALENTS: { task: string; jmespath: string; jsonpath: string }[] = [
  { task: "A field", jmespath: "store.name", jsonpath: "$.store.name" },
  { task: "Every item's field", jmespath: "items[].price", jsonpath: "$.items[*].price" },
  { task: "First item", jmespath: "items[0]", jsonpath: "$.items[0]" },
  { task: "Last item", jmespath: "items[-1]", jsonpath: "$.items[-1:]" },
  { task: "Filter", jmespath: "items[?price > `10`]", jsonpath: "$.items[?(@.price > 10)]" },
  { task: "Pick fields into a new object", jmespath: "items[].{n: name, p: price}", jsonpath: "(not possible)" },
  { task: "Count", jmespath: "length(items)", jsonpath: "$.items.length() (some engines only)" },
  { task: "Any depth", jmespath: "(not possible)", jsonpath: "$..price" },
];
