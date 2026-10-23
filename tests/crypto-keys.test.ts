import { describe, expect, it } from "vitest";
import { md5, hmacMd5 } from "@/lib/md5";
import { computeJwkThumbprint, canonicalJwkJson } from "@/lib/jwk-thumbprint";
import { pemToJwk, jwkToPem, detectKeyClass } from "@/lib/jwk-pem";

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const ascii = (s: string) => new TextEncoder().encode(s);

describe("MD5 — RFC 1321 §A.5 test suite", () => {
  const vectors: [string, string][] = [
    ["", "d41d8cd98f00b204e9800998ecf8427e"],
    ["a", "0cc175b9c0f1b6a831c399e269772661"],
    ["abc", "900150983cd24fb0d6963f7d28e17f72"],
    ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
    ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
    ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "d174ab98d277d9f5a5611c2c9f419d9f"],
    ["12345678901234567890123456789012345678901234567890123456789012345678901234567890", "57edf4a22be3c955ac49da2e2107b67a"],
  ];
  it.each(vectors)("MD5(%j)", (input, digest) => {
    expect(hex(md5(ascii(input)))).toBe(digest);
  });

  it("handles inputs around the 55/56/64-byte padding boundaries", () => {
    // Values from Node's crypto, an independent implementation
    expect(hex(md5(ascii("a".repeat(55))))).toBe("ef1772b6dff9a122358552954ad0df65");
    expect(hex(md5(ascii("a".repeat(56))))).toBe("3b0c8ac703f828b04c6c197006d17218");
    expect(hex(md5(ascii("a".repeat(64))))).toBe("014842d480b571495a4a0363793f7367");
  });
});

describe("HMAC-MD5 — RFC 2104 / RFC 2202 test cases", () => {
  it("test case 1 (0x0b × 16, 'Hi There')", () => {
    expect(hex(hmacMd5(new Uint8Array(16).fill(0x0b), ascii("Hi There")))).toBe("9294727a3638bb1c13f48ef8158bfc9d");
  });
  it("test case 2 (key 'Jefe')", () => {
    expect(hex(hmacMd5(ascii("Jefe"), ascii("what do ya want for nothing?")))).toBe("750c783e6ab0b503eaa86e310a5db738");
  });
  it("test case 6 (key longer than the block size is hashed first)", () => {
    expect(hex(hmacMd5(new Uint8Array(80).fill(0xaa), ascii("Test Using Larger Than Block-Size Key - Hash Key First")))).toBe(
      "6b1ab7fe4bd7bf8f0b62e6ce61b9d0cd"
    );
  });
});

describe("JWK thumbprint — RFC 7638 §3.1 example", () => {
  const jwk = {
    kty: "RSA",
    n: "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
    e: "AQAB",
    alg: "RS256",
    kid: "2011-04-29",
  };

  it("canonical JSON has only the required members, in lexicographic order", () => {
    const c = canonicalJwkJson(jwk);
    expect(c.startsWith('{"e":"AQAB","kty":"RSA","n":"0vx7agoe')).toBe(true);
    expect(c).not.toMatch(/alg|kid/);
  });

  it("SHA-256 thumbprint matches the RFC", async () => {
    expect((await computeJwkThumbprint(jwk)).thumbprint).toBe("NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs");
  });

  it("EC keys use crv, kty, x, y", () => {
    expect(canonicalJwkJson({ kty: "EC", crv: "P-256", x: "X", y: "Y", d: "secret" } as JsonWebKey)).toBe('{"crv":"P-256","kty":"EC","x":"X","y":"Y"}');
  });

  it("rejects missing members and unknown key types", () => {
    expect(() => canonicalJwkJson({ kty: "RSA", n: "abc" })).toThrow(/"e"/);
    expect(() => canonicalJwkJson({ kty: "XYZ" } as JsonWebKey)).toThrow(/Unsupported key type/);
    expect(() => canonicalJwkJson({} as JsonWebKey)).toThrow(/kty/);
  });
});

describe("JWK ↔ PEM", () => {
  it("round-trips an EC P-256 key pair (public and private)", async () => {
    const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pubJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const privJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);

    const pubPem = await jwkToPem(pubJwk, "public");
    expect(pubPem).toMatch(/^-----BEGIN PUBLIC KEY-----\n[\s\S]+\n-----END PUBLIC KEY-----$/);
    expect(detectKeyClass(pubPem)).toBe("public");
    expect(await pemToJwk(pubPem, "public")).toMatchObject({ kty: "EC", crv: "P-256", x: pubJwk.x, y: pubJwk.y });

    const privPem = await jwkToPem(privJwk, "private");
    expect(detectKeyClass(privPem)).toBe("private");
    expect(await pemToJwk(privPem, "private")).toMatchObject({ kty: "EC", crv: "P-256", d: privJwk.d });
  });

  it("round-trips an RSA public key", async () => {
    const pair = (await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"]
    )) as CryptoKeyPair;
    const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const pem = await jwkToPem(jwk, "public");
    expect(await pemToJwk(pem, "public")).toMatchObject({ kty: "RSA", n: jwk.n, e: "AQAB" });
  });

  it("PEM lines are wrapped at 64 characters", async () => {
    const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-384" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pem = await jwkToPem(await crypto.subtle.exportKey("jwk", pair.publicKey), "public");
    for (const line of pem.split("\n").slice(1, -1)) expect(line.length).toBeLessThanOrEqual(64);
  });

  it("detects key class from PEM headers and JWK JSON", () => {
    expect(detectKeyClass('{"kty":"EC","crv":"P-256","x":"a","y":"b"}')).toBe("public");
    expect(detectKeyClass('{"kty":"EC","d":"secret"}')).toBe("private");
    expect(detectKeyClass("hello")).toBeNull();
  });

  it("rejects unsupported key types and garbage PEM", async () => {
    await expect(jwkToPem({ kty: "oct", k: "abc" }, "public")).rejects.toThrow(/Unsupported key type/);
    await expect(jwkToPem({ kty: "EC", x: "a", y: "b" }, "public")).rejects.toThrow(/crv/);
    await expect(pemToJwk("-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----", "public")).rejects.toThrow(/RSA or EC/);
  });
});
