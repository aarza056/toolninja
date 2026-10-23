import { describe, expect, it } from "vitest";
import { base32Encode, base32Decode, base32EncodeText, base32DecodeToText } from "@/lib/base32";
import { base58Encode, base58Decode, base58EncodeText, base58DecodeToText, base58CheckEncode, base58CheckDecode, hexToBytes, bytesToHex } from "@/lib/base58";
import { base62Encode, base62Decode, base62EncodeText, base62DecodeToText } from "@/lib/base62";

const bytes = (...b: number[]) => new Uint8Array(b);

describe("Base32 — RFC 4648 §10 test vectors", () => {
  const vectors: [string, string][] = [
    ["", ""],
    ["f", "MY======"],
    ["fo", "MZXQ===="],
    ["foo", "MZXW6==="],
    ["foob", "MZXW6YQ="],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI======"],
  ];
  it.each(vectors)("%j ↔ %j", (plain, encoded) => {
    expect(base32EncodeText(plain)).toBe(encoded);
    expect(base32DecodeToText(encoded)).toBe(plain);
  });

  it("decodes lowercase, unpadded and whitespace-padded input", () => {
    expect(base32DecodeToText("mzxw6ytboi")).toBe("foobar");
    expect(base32DecodeToText("  MZXW6YTBOI======  ")).toBe("foobar");
  });

  it("rejects characters outside the RFC 4648 alphabet", () => {
    expect(() => base32Decode("MZXW1")).toThrow(/not a valid Base32/);
    expect(() => base32Decode("MZXW8")).toThrow();
  });

  it("round-trips arbitrary bytes", () => {
    const data = bytes(0, 255, 1, 128, 64, 32, 16, 8, 4, 2, 1);
    expect(base32Decode(base32Encode(data))).toEqual(data);
  });
});

describe("Base58 (Bitcoin alphabet)", () => {
  it("encodes known values", () => {
    expect(base58EncodeText("Hello World!")).toBe("2NEpo7TZRRrLZSi2U");
    // two leading zero bytes → two leading '1's (value checked against an independent implementation)
    expect(base58Encode(hexToBytes("0000287fb4cd"))).toBe("11233QC4");
  });

  it("keeps leading zero bytes as leading '1's", () => {
    expect(base58Encode(bytes(0))).toBe("1");
    expect(base58Encode(bytes(0, 0, 0, 1))).toBe("1112");
    expect(base58Decode("1112")).toEqual(bytes(0, 0, 0, 1));
    expect(base58Decode("1")).toEqual(bytes(0));
  });

  it("handles empty input", () => {
    expect(base58Encode(bytes())).toBe("");
    expect(base58Decode("")).toEqual(bytes());
  });

  it("round-trips text and binary", () => {
    expect(base58DecodeToText(base58EncodeText("ToolNinja ✓"))).toBe("ToolNinja ✓");
    const data = bytes(0, 0, 9, 200, 255, 0, 17);
    expect(base58Decode(base58Encode(data))).toEqual(data);
  });

  it("rejects the excluded characters 0, O, I, l", () => {
    for (const bad of ["0", "O", "I", "l"]) expect(() => base58Decode(`2${bad}`)).toThrow(/not a valid Base58/);
  });

  it("Base58Check: known Bitcoin address round trip and checksum validation", async () => {
    // Version byte 0x00 + RIPEMD160 hash of the genesis block's public key
    const payload = hexToBytes("0062e907b15cbf27d5425399ebf6f0fb50ebb88f18");
    const address = await base58CheckEncode(payload);
    expect(address).toBe("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
    expect(bytesToHex(await base58CheckDecode(address))).toBe("0062e907b15cbf27d5425399ebf6f0fb50ebb88f18");
    // One character changed → checksum mismatch
    await expect(base58CheckDecode("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb")).rejects.toThrow();
  });
});

describe("Base62 (0-9A-Za-z)", () => {
  it("encodes known values", () => {
    expect(base62Encode(bytes(1))).toBe("1");
    expect(base62Encode(bytes(61))).toBe("z");
    expect(base62Encode(bytes(62))).toBe("10");
    expect(base62Encode(bytes(255, 255))).toBe("H31");
  });

  it("keeps leading zero bytes as leading '0's", () => {
    expect(base62Encode(bytes(0))).toBe("0");
    expect(base62Encode(bytes(0, 0, 1))).toBe("001");
    expect(base62Decode("001")).toEqual(bytes(0, 0, 1));
    expect(base62Decode("0")).toEqual(bytes(0));
    expect(base62Decode("000")).toEqual(bytes(0, 0, 0));
  });

  it("handles empty input", () => {
    expect(base62Encode(bytes())).toBe("");
    expect(base62Decode("")).toEqual(bytes());
    expect(base62Decode("   ")).toEqual(bytes());
  });

  it("round-trips text and binary", () => {
    expect(base62DecodeToText(base62EncodeText("Hello, 世界"))).toBe("Hello, 世界");
    const data = bytes(0, 7, 0, 255, 128, 1);
    expect(base62Decode(base62Encode(data))).toEqual(data);
  });

  it("rejects characters outside the alphabet", () => {
    expect(() => base62Decode("abc-def")).toThrow(/Invalid Base62 character/);
    expect(() => base62Decode("a+b")).toThrow();
  });
});
