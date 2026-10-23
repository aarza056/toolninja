import { describe, expect, it } from "vitest";
import { parseCsv, csvToJson, jsonToCsv } from "@/lib/csv-json";
import { diffJson, deepEqual, formatValue } from "@/lib/json-diff";
import { slugify } from "@/lib/slugify";
import { parseUrl, buildUrlWithParams } from "@/lib/url-parser";

describe("CSV parsing (RFC 4180 + common real-world input)", () => {
  it("parses a simple table", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });

  it("handles quoted fields with delimiters, escaped quotes and newlines", () => {
    const csv = 'name,quote\n"Doe, Jane","She said ""hi"""\n"multi\nline",x';
    expect(parseCsv(csv)).toEqual([["name", "quote"], ["Doe, Jane", 'She said "hi"'], ["multi\nline", "x"]]);
  });

  it("handles CRLF line endings and a trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps empty fields", () => {
    expect(parseCsv("a,,c\n,,")).toEqual([["a", "", "c"], ["", "", ""]]);
  });

  it("treats a quote inside an unquoted field as a literal character", () => {
    // e.g. inch marks: only a quote at the *start* of a field opens a quoted field
    expect(parseCsv('size,price\n5" screen,10\n12" laptop,20')).toEqual([["size", "price"], ['5" screen', "10"], ['12" laptop', "20"]]);
  });

  it("supports a custom delimiter", () => {
    expect(parseCsv("a;b\n1;2,5", ";")).toEqual([["a", "b"], ["1", "2,5"]]);
  });

  it("csvToJson uses the header row and fills missing cells", () => {
    expect(csvToJson("id,name\n1,Ada\n2")).toEqual([{ id: "1", name: "Ada" }, { id: "2", name: "" }]);
    expect(csvToJson("")).toEqual([]);
  });

  it("jsonToCsv unions keys, escapes, and serialises nested values", () => {
    const csv = jsonToCsv([{ a: 1, b: "x,y" }, { b: 'say "hi"', c: { d: 1 } }, { a: null }]);
    expect(csv).toBe('a,b,c\n1,"x,y",\n,"say ""hi""","{""d"":1}"\n,,');
    expect(jsonToCsv([])).toBe("");
  });

  it("round-trips through jsonToCsv → csvToJson", () => {
    const rows = [{ name: "Doe, Jane", note: 'line1\nline2 "q"' }, { name: "Bob", note: "" }];
    expect(csvToJson(jsonToCsv(rows))).toEqual(rows);
  });
});

describe("JSON diff", () => {
  it("reports added, removed and changed keys with paths", () => {
    const d = diffJson({ a: 1, b: { c: 2, d: 3 } }, { a: 1, b: { c: 5 }, e: true });
    expect(d).toEqual([
      { path: "$.b.c", type: "changed", oldValue: 2, newValue: 5 },
      { path: "$.b.d", type: "removed", oldValue: 3 },
      { path: "$.e", type: "added", newValue: true },
    ]);
  });

  it("ignores key order", () => {
    expect(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });

  it("compares arrays by index by default", () => {
    expect(diffJson([1, 2], [2, 1])).toHaveLength(2);
    expect(diffJson([1], [1, 2])).toEqual([{ path: "$[1]", type: "added", newValue: 2 }]);
  });

  it("ignoreArrayOrder compares arrays as multisets", () => {
    expect(diffJson([1, 2, 3], [3, 1, 2], "$", { ignoreArrayOrder: true })).toEqual([]);
    expect(diffJson([1, 1, 2], [1, 2, 2], "$", { ignoreArrayOrder: true })).toEqual([
      { path: "$[1]", type: "removed", oldValue: 1 },
      { path: "$[2]", type: "added", newValue: 2 },
    ]);
    expect(diffJson([{ x: 1 }, { y: 2 }], [{ y: 2 }, { x: 1 }], "$", { ignoreArrayOrder: true })).toEqual([]);
  });

  it("treats type changes as a single change", () => {
    expect(diffJson({ a: [1] }, { a: { 0: 1 } })).toEqual([{ path: "$.a", type: "changed", oldValue: [1], newValue: { 0: 1 } }]);
    expect(diffJson(null, {})).toEqual([{ path: "$", type: "changed", oldValue: null, newValue: {} }]);
  });

  it("deepEqual and formatValue", () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(formatValue("x")).toBe('"x"');
    expect(formatValue(undefined)).toBe("undefined");
  });
});

describe("slugify", () => {
  const dash = { separator: "-", lowercase: true } as const;

  it("lowercases, strips punctuation and collapses separators", () => {
    expect(slugify("  Hello, World!  -- Test  ", dash)).toBe("hello-world-test");
  });

  it("transliterates accents and special letters", () => {
    expect(slugify("Héllo Wörld — Ça va? Straße Æon", dash)).toBe("hello-world-ca-va-strasse-aeon");
  });

  it("supports underscore separators and keeping case", () => {
    expect(slugify("Hello Big World", { separator: "_", lowercase: false })).toBe("Hello_Big_World");
  });

  it("removes stopwords, but never everything", () => {
    expect(slugify("The Quick Guide to the API", { ...dash, removeStopwords: true })).toBe("quick-guide-api");
    expect(slugify("the and of", { ...dash, removeStopwords: true })).toBe("the-and-of");
  });

  it("truncates to maxLength without a trailing separator", () => {
    expect(slugify("one two three four", { ...dash, maxLength: 8 })).toBe("one-two");
    expect(slugify("abc", { ...dash, maxLength: 10 })).toBe("abc");
  });

  it("returns an empty string for input with nothing usable", () => {
    expect(slugify("!!! ??? ---", dash)).toBe("");
  });
});

describe("URL parser", () => {
  it("breaks a URL into its parts and decodes query params", () => {
    const u = parseUrl("https://user:pass@example.com:8080/a/b?x=1&y=two%20words&x=2#frag")!;
    expect(u).toMatchObject({ protocol: "https", username: "user", password: "pass", hostname: "example.com", port: "8080", pathname: "/a/b", hash: "#frag" });
    expect(u.params).toEqual([
      { key: "x", value: "1" },
      { key: "y", value: "two words" },
      { key: "x", value: "2" },
    ]);
  });

  it("returns null for things that aren't absolute URLs", () => {
    expect(parseUrl("example.com/path")).toBeNull();
    expect(parseUrl("")).toBeNull();
  });

  it("buildUrlWithParams replaces the query, encodes values, skips empty keys", () => {
    expect(
      buildUrlWithParams("https://example.com/p?old=1#top", [
        { key: "utm_source", value: "news letter" },
        { key: "", value: "ignored" },
        { key: "q", value: "a&b" },
      ])
    ).toBe("https://example.com/p?utm_source=news+letter&q=a%26b#top");
    expect(buildUrlWithParams("not a url", [])).toBe("");
  });
});
