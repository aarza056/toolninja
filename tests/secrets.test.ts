import { describe, expect, it } from "vitest";
import { scanForSecrets, redactSecrets } from "@/lib/secret-scanner";

// Test fixtures only — well-known example values and random strings, not real credentials.
const AWS = "AKIAIOSFODNN7EXAMPLE";
const GITHUB = "ghp_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8";
const STRIPE = "sk_" + "test_" + "4eC39HqLyjWDarjtT1zdp7dc";
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";

describe("secret scanner", () => {
  it("finds well-known key formats and reports their lines", () => {
    const text = [`const aws = "${AWS}";`, `token: ${GITHUB}`, `stripe=${STRIPE}`].join("\n");
    const f = scanForSecrets(text);
    expect(f.map((x) => [x.rule, x.line])).toEqual([
      ["AWS Access Key ID", 1],
      ["GitHub Personal Access Token", 2],
      ["Stripe Secret Key", 3],
    ]);
  });

  it("never returns the full secret, only a redacted preview", () => {
    const [f] = scanForSecrets(AWS);
    expect(f.match).not.toBe(AWS);
    expect(f.match).toContain("…");
  });

  it("detects private key blocks, including encrypted and PGP ones", () => {
    for (const header of ["-----BEGIN PRIVATE KEY-----", "-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN OPENSSH PRIVATE KEY-----", "-----BEGIN ENCRYPTED PRIVATE KEY-----", "-----BEGIN PGP PRIVATE KEY BLOCK-----"]) {
      expect(scanForSecrets(`${header}\nMIIB...`).some((f) => f.rule === "Private Key Block")).toBe(true);
    }
    expect(scanForSecrets("-----BEGIN PUBLIC KEY-----")).toEqual([]);
  });

  it("flags JWT-shaped tokens and secret-looking assignments", () => {
    expect(scanForSecrets(`Authorization: Bearer ${JWT}`).some((f) => f.rule === "JWT-shaped token")).toBe(true);
    expect(scanForSecrets(`api_key = "abcdefghijklmnop1234"`).some((f) => f.rule.startsWith("Possible hardcoded secret"))).toBe(true);
  });

  it("doesn't flag ordinary text", () => {
    expect(scanForSecrets("const total = 42; // AKIA is a prefix but this is short")).toEqual([]);
    expect(scanForSecrets("")).toEqual([]);
  });

  it("redactSecrets removes the actual secret values from text", () => {
    const text = `my key ${AWS} and ${GITHUB} broke it`;
    const r = redactSecrets(text);
    expect(r.count).toBe(2);
    expect(r.text).toBe("my key [removed] and [removed] broke it");
    expect(r.text).not.toContain("AKIA");
  });

  it("redactSecrets leaves clean text untouched", () => {
    expect(redactSecrets("Great tool, thanks!")).toEqual({ text: "Great tool, thanks!", count: 0 });
  });
});
