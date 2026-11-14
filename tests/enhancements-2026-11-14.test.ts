import { describe, expect, it } from "vitest";
import { deflateRawSync } from "node:zlib";
import { applySymbolic, parseLsLine, rwxToMode, shortOctal, umaskFor, umaskInfo } from "@/lib/chmod-modes";
import { checkVersion, sortVersions, splitVersions } from "@/lib/semver-validate";
import { csvToJsonAdvanced, detectDelimiter, flattenRow, inferValue, jsonToCsv, rowsFromJson } from "@/lib/csv-json";
import { kindOf, odtXmlToText, readZipEntry, slideXmlToText, wordXmlToText, zipEntries } from "@/lib/file-text";
import { createZip } from "@/lib/zip-store";
import { FAKE_DATA_PAGES } from "@/lib/fake-data-pages";
import { buildSql, generateRows } from "@/lib/fake-data";

describe("chmod: ls -l, symbolic changes and umask", () => {
  it("reads permission strings and ls -l lines", () => {
    expect(shortOctal(rwxToMode("rwxr-xr-x")!)).toBe("755");
    expect(shortOctal(rwxToMode("rwsr-xr-x")!)).toBe("4755");
    expect(shortOctal(rwxToMode("rwxrwxrwt")!)).toBe("1777");
    expect(shortOctal(rwxToMode("rw-r-Sr--")!)).toBe("2644");
    const e = parseLsLine("drwxr-x--- 2 deploy www-data 4096 Nov 14 09:12 my releases");
    expect(e).toMatchObject({ short: "750", typeLabel: "directory", owner: "deploy", group: "www-data", name: "my releases" });
    expect(parseLsLine("dr-xr-xr-x")?.short).toBe("555");
    expect(parseLsLine("-rw-r--r--@ 1 a staff 0 Jan 1 2026 x")?.short).toBe("644");
    expect(parseLsLine("hello")).toBeNull();
  });

  it("applies symbolic expressions like chmod", () => {
    expect(shortOctal(applySymbolic(0o644, "u+x")!)).toBe("744");
    expect(shortOctal(applySymbolic(0o777, "go-w")!)).toBe("755");
    expect(shortOctal(applySymbolic(0o600, "u=rwx,g=rx,o=")!)).toBe("750");
    expect(shortOctal(applySymbolic(0o644, "a+X")!)).toBe("644");
    expect(shortOctal(applySymbolic(0o744, "a+X")!)).toBe("755");
    expect(shortOctal(applySymbolic(0o755, "u+s")!)).toBe("4755");
    expect(shortOctal(applySymbolic(0o777, "+t")!)).toBe("1777");
    expect(shortOctal(applySymbolic(0o640, "o=g")!)).toBe("644");
    expect(applySymbolic(0o644, "chmod 600")).toBe(0o600);
    expect(applySymbolic(0o644, "q+z")).toBeNull();
  });

  it("computes umask defaults", () => {
    expect(umaskInfo("022")).toMatchObject({ files: "644", dirs: "755", symbolic: "u=rwx,g=rx,o=rx" });
    expect(umaskInfo("0077")).toMatchObject({ files: "600", dirs: "700" });
    expect(umaskInfo("9")).toBeNull();
    expect(umaskFor("750")).toBe("0027");
  });
});

describe("semver validate and sort", () => {
  it("explains why versions are invalid and suggests a fix", () => {
    expect(checkVersion("1.2.3-rc.1+build.5")).toMatchObject({ strict: true, npm: true });
    expect(checkVersion("v1.2.3")).toMatchObject({ strict: false, npm: true, normalized: "1.2.3" });
    expect(checkVersion("1.2")).toMatchObject({ strict: false, npm: false, suggestion: "1.2.0" });
    expect(checkVersion("1.2").problem).toMatch(/two numbers/);
    expect(checkVersion("01.2.3").problem).toMatch(/leading zeros/);
    expect(checkVersion("1.2.3.4").problem).toMatch(/4 numbers/);
    expect(checkVersion("1.0.0-rc.01").problem).toMatch(/rc.01/);
  });

  it("sorts by precedence, not as text", () => {
    const r = sortVersions(splitVersions("1.10.0, 1.9.0 2.0.0-rc.1\n2.0.0\n2.0.0-beta.11\n2.0.0-beta.2\n1.9.0\nnope"));
    expect(r.sorted).toEqual(["1.9.0", "1.10.0", "2.0.0-beta.2", "2.0.0-beta.11", "2.0.0-rc.1", "2.0.0"]);
    expect(r).toMatchObject({ duplicates: 1, invalid: ["nope"], latest: "2.0.0", latestStable: "2.0.0" });
    expect(sortVersions(["1.0.0", "2.0.0-rc.1"], true)).toMatchObject({ sorted: ["2.0.0-rc.1", "1.0.0"], latest: "2.0.0-rc.1", latestStable: "1.0.0" });
  });
});

describe("CSV ↔ JSON: detection, types and nesting", () => {
  it("detects the delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2,5;3\n4;5;6")).toBe(";");
    expect(detectDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(detectDelimiter('name,quote\n"Smith; John","a|b"\nx,y')).toBe(",");
    expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("infers types but keeps zip codes and IDs as text", () => {
    expect(inferValue("42")).toBe(42);
    expect(inferValue("-3.5e2")).toBe(-350);
    expect(inferValue("02134")).toBe("02134");
    expect(inferValue("12345678901234567890")).toBe("12345678901234567890");
    expect(inferValue("TRUE")).toBe(true);
    expect(inferValue("")).toBeNull();
    expect(inferValue("1,5")).toBe("1,5");
  });

  it("nests dotted headers and flattens back", () => {
    const rows = csvToJsonAdvanced("﻿name,age,address.city,tags.0,tags.1\nAda,36,London,math,engines", ",", { types: true, nested: true });
    expect(rows).toEqual([{ name: "Ada", age: 36, address: { city: "London" }, tags: ["math", "engines"] }]);
    const csv = jsonToCsv(rows.map((r) => flattenRow(r)));
    expect(csv.split("\n")[0]).toBe("name,age,address.city,tags.0,tags.1");
    expect(csvToJsonAdvanced("a,a\n1,2", ",", {})).toEqual([{ a: "1", a_2: "2" }]);
    // A zip code column with one leading zero stays text in every row
    expect(csvToJsonAdvanced("zip,n\n02134,1\n10001,2", ",", { types: true })).toEqual([
      { zip: "02134", n: 1 },
      { zip: "10001", n: 2 },
    ]);
    expect(csvToJsonAdvanced("1,2\n3,4", ",", { header: false })).toEqual([
      { column1: "1", column2: "2" },
      { column1: "3", column2: "4" },
    ]);
  });

  it("finds rows in wrapped JSON and NDJSON", () => {
    expect(rowsFromJson('{"data":[{"a":1}],"total":1}')).toEqual({ rows: [{ a: 1 }], from: "data" });
    expect(rowsFromJson('{"a":1}\n{"a":2}').rows).toHaveLength(2);
    expect(() => rowsFromJson("nope")).toThrow();
  });
});

describe("file text extraction", () => {
  const enc = new TextEncoder();

  /** A ZIP with deflated entries, as Word and PowerPoint write them */
  function deflatedZip(files: { name: string; text: string }[]): Uint8Array {
    const parts: number[] = [];
    const central: number[] = [];
    const u16 = (a: number[], v: number) => a.push(v & 255, (v >> 8) & 255);
    const u32 = (a: number[], v: number) => a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255);
    for (const f of files) {
      const name = enc.encode(f.name);
      const raw = enc.encode(f.text);
      const comp = new Uint8Array(deflateRawSync(raw));
      const offset = parts.length;
      [0x04034b50].forEach((v) => u32(parts, v));
      [20, 0, 8, 0, 0].forEach((v) => u16(parts, v));
      [0, comp.length, raw.length].forEach((v) => u32(parts, v));
      [name.length, 0].forEach((v) => u16(parts, v));
      parts.push(...Array.from(name), ...Array.from(comp));
      u32(central, 0x02014b50);
      [20, 20, 0, 8, 0, 0].forEach((v) => u16(central, v));
      [0, comp.length, raw.length].forEach((v) => u32(central, v));
      [name.length, 0, 0, 0, 0].forEach((v) => u16(central, v));
      [0, offset].forEach((v) => u32(central, v));
      central.push(...Array.from(name));
    }
    const eocd: number[] = [];
    u32(eocd, 0x06054b50);
    [0, 0, files.length, files.length].forEach((v) => u16(eocd, v));
    [central.length, parts.length].forEach((v) => u32(eocd, v));
    u16(eocd, 0);
    return new Uint8Array([...parts, ...central, ...eocd]);
  }

  it("reads stored and deflated ZIP entries", async () => {
    const stored = createZip([{ name: "a.txt", data: enc.encode("hello") }]);
    expect(new TextDecoder().decode(await readZipEntry(stored, zipEntries(stored)[0]))).toBe("hello");
    const docx = deflatedZip([
      { name: "word/document.xml", text: "<w:document><w:body><w:p><w:r><w:t>Hello</w:t></w:r><w:r><w:tab/><w:t>world &amp; more</w:t></w:r></w:p><w:p><w:r><w:t>Line two</w:t></w:r></w:p></w:body></w:document>" },
    ]);
    const xml = new TextDecoder().decode(await readZipEntry(docx, zipEntries(docx)[0]));
    expect(wordXmlToText(xml)).toBe("Hello\tworld & more\nLine two");
  });

  it("reads slide and OpenDocument text", () => {
    expect(slideXmlToText("<p:sld><a:p><a:r><a:t>Title</a:t></a:r></a:p><a:p><a:r><a:t>Point &lt;1&gt;</a:t></a:r></a:p></p:sld>")).toBe("Title\nPoint <1>");
    expect(odtXmlToText('<office:text><text:h>Head</text:h><text:p>a<text:s text:c="2"/>b</text:p></office:text>')).toBe("Head\na  b");
  });

  it("knows which files it can read", () => {
    expect(kindOf({ name: "Report.PDF", type: "" })).toBe("pdf");
    expect(kindOf({ name: "a.docx", type: "" })).toBe("docx");
    expect(kindOf({ name: "main.py", type: "" })).toBe("text");
    expect(kindOf({ name: "photo.jpg", type: "image/jpeg" })).toBeNull();
  });
});

describe("fake data format pages", () => {
  it("each page generates output and has unique, descriptive metadata", () => {
    const slugs = new Set<string>();
    for (const p of FAKE_DATA_PAGES) {
      expect(slugs.has(p.slug)).toBe(false);
      slugs.add(p.slug);
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.description.length).toBeGreaterThanOrEqual(110);
      expect(p.description.length).toBeLessThanOrEqual(165);
      const rows = generateRows(p.fields, 3, "t");
      expect(rows).toHaveLength(3);
      if (p.format === "sql") expect(buildSql(rows, p.table, p.dialect!, { createTable: true })).toMatch(/^CREATE TABLE/);
    }
  });
});
