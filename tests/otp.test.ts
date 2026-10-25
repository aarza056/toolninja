import { describe, expect, it } from "vitest";
import { extractSecret } from "@/lib/totp";

describe("2FA live code: secrets pasted in common formats", () => {
  it("bare, spaced, lowercase, padded", () => {
    expect(extractSecret("JBSWY3DPEHPK3PXP")).toEqual({ secret: "JBSWY3DPEHPK3PXP", label: "" });
    expect(extractSecret("jbsw y3dp ehpk 3pxp")?.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(extractSecret("JBSWY3DPEHPK3PXP====")?.secret).toBe("JBSWY3DPEHPK3PXP");
  });
  it("label|secret and user:pass:secret lines keep the rest as a label", () => {
    expect(extractSecret("github|JBSWY3DPEHPK3PXP")).toEqual({ secret: "JBSWY3DPEHPK3PXP", label: "github" });
    expect(extractSecret("alice:hunter2:JBSWY3DPEHPK3PXP")).toEqual({ secret: "JBSWY3DPEHPK3PXP", label: "alice · hunter2" });
  });
  it("otpauth links and junk", () => {
    expect(extractSecret("otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub")).toEqual({ secret: "JBSWY3DPEHPK3PXP", label: "GitHub · alice" });
    expect(extractSecret("hello world")).toBeNull();
    expect(extractSecret("ABC123")).toBeNull();
  });
});
import { generateTOTP, hotp, base32Encode, base32Decode, buildOtpauthUrl, parseOtpauthUrl, secondsRemaining, generateRandomSecret } from "@/lib/totp";
import { generateHOTP, buildHotpOtpauthUrl, parseHotpOtpauthUrl } from "@/lib/hotp";

const ascii = (s: string) => new TextEncoder().encode(s);

describe("HOTP — RFC 4226 Appendix D", () => {
  // Secret = ASCII "12345678901234567890"
  const expected = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
  it.each(expected.map((code, counter) => [counter, code] as const))("counter %i → %s", async (counter, code) => {
    expect(await hotp(ascii("12345678901234567890"), counter, 6, "SHA-1")).toBe(code);
  });

  it("generateHOTP takes a Base32 secret", async () => {
    const secret = base32Encode(ascii("12345678901234567890"));
    expect(await generateHOTP(secret, 0)).toBe("755224");
    expect(await generateHOTP(secret, 9)).toBe("520489");
  });

  it("otpauth://hotp round trip keeps the counter", () => {
    const url = buildHotpOtpauthUrl("JBSWY3DPEHPK3PXP", "alice@example.com", "ToolNinja", 42);
    const parsed = parseHotpOtpauthUrl(url);
    expect(parsed).toMatchObject({ secret: "JBSWY3DPEHPK3PXP", label: "alice@example.com", issuer: "ToolNinja", counter: 42 });
    expect(parseHotpOtpauthUrl("otpauth://totp/x?secret=ABC")).toBeNull();
  });
});

describe("TOTP — RFC 6238 Appendix B", () => {
  // Seeds per algorithm: 20, 32 and 64 ASCII bytes of "1234567890..."
  const seeds = {
    "SHA-1": "12345678901234567890",
    "SHA-256": "12345678901234567890123456789012",
    "SHA-512": "1234567890123456789012345678901234567890123456789012345678901234",
  } as const;
  const vectors: [number, string, string, string][] = [
    // time (s), SHA-1, SHA-256, SHA-512 — 8 digits
    [59, "94287082", "46119246", "90693936"],
    [1111111109, "07081804", "68084774", "25091201"],
    [1111111111, "14050471", "67062674", "99943326"],
    [1234567890, "89005924", "91819424", "93441116"],
    [2000000000, "69279037", "90698825", "38618901"],
    [20000000000, "65353130", "77737706", "47863826"],
  ];
  for (const [t, sha1, sha256, sha512] of vectors) {
    it(`T=${t}`, async () => {
      for (const [alg, code] of [["SHA-1", sha1], ["SHA-256", sha256], ["SHA-512", sha512]] as const) {
        const secret = base32Encode(ascii(seeds[alg]));
        expect(await generateTOTP(secret, { digits: 8, period: 30, algorithm: alg }, t * 1000)).toBe(code);
      }
    });
  }

  it("6-digit default uses the last 6 digits of the same value", async () => {
    const secret = base32Encode(ascii(seeds["SHA-1"]));
    expect(await generateTOTP(secret, undefined, 59_000)).toBe("287082");
  });

  it("secondsRemaining counts down within the period", () => {
    expect(secondsRemaining(30, 0)).toBe(30);
    expect(secondsRemaining(30, 29_000)).toBe(1);
    expect(secondsRemaining(30, 30_000)).toBe(30);
  });

  it("random secrets are Base32 of the requested length", () => {
    const s = generateRandomSecret(20);
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(s)).toHaveLength(20);
    expect(generateRandomSecret(20)).not.toBe(s);
  });

  it("otpauth://totp round trip", () => {
    const url = buildOtpauthUrl("JBSWY3DPEHPK3PXP", "alice@example.com", "ToolNinja", { digits: 8, period: 60, algorithm: "SHA-256" });
    expect(url.startsWith("otpauth://totp/ToolNinja%3Aalice%40example.com?")).toBe(true);
    expect(parseOtpauthUrl(url)).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      label: "alice@example.com",
      issuer: "ToolNinja",
      opts: { digits: 8, period: 60, algorithm: "SHA-256" },
    });
  });

  it("parseOtpauthUrl rejects non-otpauth URLs and missing secrets", () => {
    expect(parseOtpauthUrl("https://example.com")).toBeNull();
    expect(parseOtpauthUrl("otpauth://totp/x")).toBeNull();
    expect(parseOtpauthUrl("not a url")).toBeNull();
  });
});
