const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ALPHABET_MAP = new Map(Array.from(ALPHABET).map((c, i) => [c, i]));

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  let value = BigInt(0);
  for (const byte of bytes) {
    value = value * BigInt(256) + BigInt(byte);
  }

  let out = "";
  while (value > BigInt(0)) {
    const remainder = value % BigInt(58);
    value = value / BigInt(58);
    out = ALPHABET[Number(remainder)] + out;
  }

  // Each leading zero byte becomes a leading '1' in the output — this is the standard
  // Base58 convention, since a leading zero byte would otherwise vanish (it contributes
  // nothing to the big-integer value) and the encoding needs to stay reversible.
  let leadingZeros = 0;
  for (const byte of bytes) {
    if (byte === 0) leadingZeros++;
    else break;
  }

  return ALPHABET[0].repeat(leadingZeros) + out;
}

export function base58Decode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);

  let value = BigInt(0);
  for (const char of input) {
    const digit = ALPHABET_MAP.get(char);
    if (digit === undefined) {
      throw new Error(`"${char}" is not a valid Base58 character (0, O, I, and l are excluded).`);
    }
    value = value * BigInt(58) + BigInt(digit);
  }

  const bytes: number[] = [];
  while (value > BigInt(0)) {
    bytes.unshift(Number(value % BigInt(256)));
    value = value / BigInt(256);
  }

  let leadingOnes = 0;
  for (const char of input) {
    if (char === ALPHABET[0]) leadingOnes++;
    else break;
  }

  return new Uint8Array([...new Array(leadingOnes).fill(0), ...bytes]);
}

export function base58EncodeText(text: string): string {
  return base58Encode(new TextEncoder().encode(text));
}

export function base58DecodeToText(input: string): string {
  return new TextDecoder().decode(base58Decode(input));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, "").replace(/^0x/i, "");
  if (clean.length % 2 !== 0) throw new Error("Hex string must have an even number of digits.");
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Invalid hex string.");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}
