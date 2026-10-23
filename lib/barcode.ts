export type BarcodeFormat = "code128" | "ean13" | "upca";

export interface BarcodeResult {
  /** Module pattern as a string of "1" (bar) / "0" (space), one character per module. */
  modules: string;
  /** The digits/text actually encoded, including any auto-computed check digit. */
  displayText: string;
}

// The 107 standard Code 128 symbol patterns (ISO/IEC 15417), each as a string of module
// widths. Symbols 0–102 are shared data characters, 103/104/105 are START A/B/C, 106 is STOP.
const CODE128_BARS = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
  "11010011100", "1100011101011",
];

const CODE128_START_B = 104;
const CODE128_STOP = 106;

/** Encodes printable ASCII (32–126) using Code 128 Subset B. */
export function encodeCode128(text: string): BarcodeResult {
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) {
      throw new Error(`Code 128 (Subset B) only supports printable ASCII characters (32–126) — "${ch}" is not supported.`);
    }
  }

  const values = text.split("").map((ch) => ch.charCodeAt(0) - 32);
  let checksum = CODE128_START_B;
  const parts = [CODE128_BARS[CODE128_START_B]];
  values.forEach((v, i) => {
    checksum += v * (i + 1);
    parts.push(CODE128_BARS[v]);
  });
  parts.push(CODE128_BARS[checksum % 103]);
  parts.push(CODE128_BARS[CODE128_STOP]);

  return { modules: parts.join(""), displayText: text };
}

const SIDE_GUARD = "101";
const MIDDLE_GUARD = "01010";

const L_PATTERNS = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const G_PATTERNS = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const R_PATTERNS = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];

// Which of L/G to use for each of the 6 left-hand digits, indexed by the value of the
// (implicit, not separately encoded) first digit of an EAN-13 code.
const EAN13_STRUCTURE = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

function ean13CheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** Encodes a 12 or 13-digit EAN-13 code (auto-computing the check digit from 12 digits). */
export function encodeEAN13(input: string): BarcodeResult {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 12 && digits.length !== 13) {
    throw new Error("EAN-13 requires 12 digits (check digit auto-computed) or 13 digits.");
  }
  const first12 = digits.slice(0, 12);
  const checkDigit = ean13CheckDigit(first12);
  if (digits.length === 13 && Number(digits[12]) !== checkDigit) {
    throw new Error(`Invalid check digit: expected ${checkDigit}, got ${digits[12]}.`);
  }
  const full = first12 + checkDigit;

  const structure = EAN13_STRUCTURE[Number(full[0])];
  const left = full
    .slice(1, 7)
    .split("")
    .map((d, i) => (structure[i] === "L" ? L_PATTERNS[Number(d)] : G_PATTERNS[Number(d)]))
    .join("");
  const right = full
    .slice(7, 13)
    .split("")
    .map((d) => R_PATTERNS[Number(d)])
    .join("");

  return {
    modules: SIDE_GUARD + left + MIDDLE_GUARD + right + SIDE_GUARD,
    displayText: full,
  };
}

/** UPC-A is bar-for-bar identical to EAN-13 with an implicit leading "0". */
export function encodeUPCA(input: string): BarcodeResult {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 12) {
    throw new Error("UPC-A requires 11 digits (check digit auto-computed) or 12 digits.");
  }
  const result = encodeEAN13("0" + digits);
  return { modules: result.modules, displayText: result.displayText.slice(1) };
}

export function generateBarcode(format: BarcodeFormat, input: string): BarcodeResult {
  if (format === "code128") return encodeCode128(input);
  if (format === "ean13") return encodeEAN13(input);
  return encodeUPCA(input);
}
