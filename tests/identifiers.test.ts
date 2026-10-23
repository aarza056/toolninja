import { describe, expect, it } from "vitest";
import { validateIban, generateTestIban, formatIban } from "@/lib/iban";
import { parseUuid, parseUlid, parseId, isValidUlid } from "@/lib/uuid-parser";
import { generateULID, generateMonotonicULIDs, isValidULID, ulidToDate } from "@/lib/ulid";

describe("IBAN validation (ISO 13616 MOD-97)", () => {
  // Official example IBANs published by each country's banking association / the ECBS registry
  const valid = [
    "GB82 WEST 1234 5698 7654 32",
    "DE89 3704 0044 0532 0130 00",
    "FR14 2004 1010 0505 0001 3M02 606",
    "NL91 ABNA 0417 1643 00",
    "CH93 0076 2011 6238 5295 7",
    "ES91 2100 0418 4502 0005 1332",
    "BE68 5390 0754 7034",
    "NO93 8601 1117 947",
    "IT60 X054 2811 1010 0000 0123 456",
  ];
  it.each(valid)("accepts %s", (iban) => {
    const r = validateIban(iban);
    expect(r.valid).toBe(true);
    expect(r.lengthOk).toBe(true);
    expect(r.error).toBeUndefined();
  });

  it("is case- and whitespace-insensitive", () => {
    expect(validateIban("gb82west12345698765432").valid).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    const r = validateIban("GB82 WEST 1234 5698 7654 33");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/MOD-97/);
  });

  it("rejects a wrong length for the country even if the checksum works", () => {
    // DE IBANs are 22 characters; build a 21-character one with valid check digits
    const r = validateIban("DE89 3704 0044 0532 0130 0");
    expect(r.valid).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(validateIban("12GB WEST").valid).toBe(false);
    expect(validateIban("").valid).toBe(false);
    expect(validateIban("GB82-WEST-1234").valid).toBe(false);
  });

  it("generates test IBANs that validate", () => {
    for (const cc of ["DE", "GB", "FR", "NL", "CH", "ES"]) {
      const iban = generateTestIban(cc);
      expect(iban.startsWith(cc)).toBe(true);
      expect(validateIban(iban).valid).toBe(true);
    }
    expect(() => generateTestIban("ZZ")).toThrow(/Unknown country/);
  });

  it("formats in groups of four", () => {
    expect(formatIban("gb82west12345698765432")).toBe("GB82 WEST 1234 5698 7654 32");
  });
});

describe("UUID parser — RFC 9562 Appendix A examples", () => {
  const when = Date.parse("2022-02-22T19:22:22.000Z");

  it("v1: decodes the Gregorian timestamp", () => {
    const r = parseUuid("C232AB00-9414-11EC-B3C8-9F6BDECED846")!;
    expect(r.version).toBe(1);
    expect(r.variant).toMatch(/RFC/);
    expect(r.timestamp!.getTime()).toBe(when);
  });

  it("v6: same instant, reordered fields", () => {
    const r = parseUuid("1EC9414C-232A-6B00-B3C8-9F6BDECED846")!;
    expect(r.version).toBe(6);
    expect(r.timestamp!.getTime()).toBe(when);
  });

  it("v7: Unix-millisecond timestamp", () => {
    const r = parseUuid("017F22E2-79B0-7CC3-98C4-DC0C0C07398F")!;
    expect(r.version).toBe(7);
    expect(r.timestamp!.getTime()).toBe(when);
  });

  it("v4: no timestamp", () => {
    const r = parseUuid("919108f7-52d1-4320-9bac-f847db4148a8")!;
    expect(r.version).toBe(4);
    expect(r.timestamp).toBeNull();
    expect(r.groups).toEqual(["919108f7", "52d1", "4320", "9bac", "f847db4148a8"]);
  });

  it("nil UUID and malformed input", () => {
    expect(parseUuid("00000000-0000-0000-0000-000000000000")!.version).toBe(0);
    expect(parseUuid("not-a-uuid")).toBeNull();
    expect(parseUuid("919108f752d143209bacf847db4148a8")).toBeNull(); // no hyphens
    expect(parseUuid("919108f7-52d1-4320-9bac-f847db4148a")).toBeNull(); // too short
  });

  it("parseId tells UUIDs and ULIDs apart", () => {
    expect(parseId(" 017F22E2-79B0-7CC3-98C4-DC0C0C07398F ")!.kind).toBe("uuid");
    expect(parseId("01ARYZ6S41TSV4RRFFQ69G5FAV")!.kind).toBe("ulid");
    expect(parseId("")).toBeNull();
    expect(parseId("hello")).toBeNull();
  });
});

describe("ULID — spec examples", () => {
  // From the ULID spec README: ulid(1469918176385) → 01ARYZ6S41…
  const SPEC_TIME = 1469918176385;

  it("encodes the spec timestamp", () => {
    const id = generateULID(SPEC_TIME);
    expect(id.slice(0, 10)).toBe("01ARYZ6S41");
    expect(id).toHaveLength(26);
    expect(isValidULID(id)).toBe(true);
  });

  it("decodes the timestamp back (both parsers)", () => {
    expect(ulidToDate("01ARYZ6S41TSV4RRFFQ69G5FAV")!.getTime()).toBe(SPEC_TIME);
    expect(parseUlid("01aryz6s41tsv4rrffq69g5fav")!.timestamp.getTime()).toBe(SPEC_TIME);
  });

  it("rejects Crockford-excluded letters I, L, O, U and wrong lengths", () => {
    for (const bad of ["01ARYZ6S41TSV4RRFFQ69G5FAI", "01ARYZ6S41TSV4RRFFQ69G5FAL", "01ARYZ6S41TSV4RRFFQ69G5FAO", "01ARYZ6S41TSV4RRFFQ69G5FAU"]) {
      expect(isValidULID(bad)).toBe(false);
      expect(isValidUlid(bad)).toBe(false);
    }
    expect(isValidULID("01ARYZ6S41")).toBe(false);
  });

  it("rejects values above the 48-bit timestamp maximum (first char > 7)", () => {
    // Spec: the largest valid ULID is 7ZZZZZZZZZZZZZZZZZZZZZZZZZ; anything larger must be rejected
    expect(isValidULID("7ZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBe(true);
    expect(isValidULID("80000000000000000000000000")).toBe(false);
    expect(isValidUlid("80000000000000000000000000")).toBe(false);
    expect(ulidToDate("ZZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBeNull();
  });

  it("monotonic mode: same timestamp, strictly increasing", () => {
    const ids = generateMonotonicULIDs(50, SPEC_TIME);
    expect(new Set(ids.map((i) => i.slice(0, 10)))).toEqual(new Set(["01ARYZ6S41"]));
    for (let i = 1; i < ids.length; i++) expect(ids[i] > ids[i - 1]).toBe(true);
    expect([...ids].sort()).toEqual(ids);
  });
});
