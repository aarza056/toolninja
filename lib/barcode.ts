export type BarcodeFormat = "code128" | "ean13" | "upca" | "ean8" | "code39" | "itf14" | "gs1128";

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

/** GS1 check digit (EAN-8, EAN-13, UPC-A, GTIN-14): weights 3,1,3… starting from the rightmost data digit */
export function gs1CheckDigit(data: string): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += Number(data[data.length - 1 - i]) * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10;
}

/** Digits with the GS1 check digit appended (from n-1 digits) or verified (from n digits) */
function withCheckDigit(input: string, n: number, name: string): string {
  const digits = input.replace(/D/g, "");
  if (digits.length !== n - 1 && digits.length !== n) throw new Error(`${name} requires ${n - 1} digits (check digit auto-computed) or ${n} digits.`);
  const data = digits.slice(0, n - 1);
  const check = gs1CheckDigit(data);
  if (digits.length === n && Number(digits[n - 1]) !== check) throw new Error(`Invalid check digit: expected ${check}, got ${digits[n - 1]}.`);
  return data + check;
}

/** Encodes a 7 or 8-digit EAN-8 (the short EAN for small packages): 4 digits each side, no parity pattern. */
export function encodeEAN8(input: string): BarcodeResult {
  const full = withCheckDigit(input, 8, "EAN-8");
  const left = full.slice(0, 4).split("").map((d) => L_PATTERNS[Number(d)]).join("");
  const right = full.slice(4).split("").map((d) => R_PATTERNS[Number(d)]).join("");
  return { modules: SIDE_GUARD + left + MIDDLE_GUARD + right + SIDE_GUARD, displayText: full };
}

// Code 39: 9 elements per character (bar, space, bar … bar), 3 of them wide. n = narrow, w = wide.
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
  F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
  P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn",
  Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", $: "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};

/** Bars-and-spaces widths (n/w) to modules, with a 3:1 wide-to-narrow ratio */
const widths = (pattern: string, startWithBar = true) =>
  pattern
    .split("")
    .map((w, i) => ((i % 2 === 0) === startWithBar ? "1" : "0").repeat(w === "w" ? 3 : 1))
    .join("");

/** Code 39 (uppercase letters, digits and - . space $ / + %), framed by * start/stop characters. Lowercase is uppercased. */
export function encodeCode39(input: string): BarcodeResult {
  const text = input.toUpperCase();
  for (const ch of text) {
    if (ch === "*" || !(ch in CODE39)) throw new Error(`Code 39 only encodes A–Z, 0–9 and - . space $ / + % — "${ch}" isn't supported.`);
  }
  const chars = `*${text}*`.split("");
  // One narrow space between characters
  return { modules: chars.map((c) => widths(CODE39[c])).join("0"), displayText: `*${text}*` };
}

// Interleaved 2 of 5: 5 elements per digit, 2 wide
const ITF = ["nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw", "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"];

/** ITF-14: a GTIN-14 for cartons and cases, in Interleaved 2 of 5 (digit pairs: one in the bars, one in the spaces). */
export function encodeITF14(input: string): BarcodeResult {
  const full = withCheckDigit(input, 14, "ITF-14");
  let modules = "1010"; // start: narrow bar, space, bar, space
  for (let i = 0; i < 14; i += 2) {
    const bars = ITF[Number(full[i])];
    const spaces = ITF[Number(full[i + 1])];
    let pair = "";
    for (let k = 0; k < 5; k++) pair += bars[k] + spaces[k];
    modules += widths(pair);
  }
  modules += "11101"; // stop: wide bar, narrow space, narrow bar
  return { modules, displayText: full };
}

// ─── GS1-128 ─────────────────────────────────────────────────────────────────

const CODE128_START_C = 105;
const CODE128_FNC1 = 102;
const CODE128_TO_B = 100; // in Code Set C: switch to Set B
const CODE128_TO_C = 99; // in Code Set B: switch to Set C

// Application Identifiers: fixed data length, or variable up to a maximum (followed by FNC1 unless last)
const AI_FIXED: Record<string, number> = { "00": 18, "01": 14, "02": 14, "11": 6, "12": 6, "13": 6, "15": 6, "16": 6, "17": 6, "20": 2, "410": 13, "411": 13, "412": 13, "413": 13, "414": 13, "415": 13, "416": 13, "417": 13, "422": 3 };
const AI_VARIABLE: Record<string, number> = { "10": 20, "21": 20, "22": 20, "240": 30, "241": 30, "30": 8, "37": 8, "400": 30, "401": 30, "403": 30, "420": 20, "90": 30, "91": 90, "92": 90, "93": 90, "94": 90, "95": 90, "96": 90, "97": 90, "98": 90, "99": 90 };

function aiRule(ai: string): { fixed: number } | { max: number } | null {
  if (ai in AI_FIXED) return { fixed: AI_FIXED[ai] };
  if (ai in AI_VARIABLE) return { max: AI_VARIABLE[ai] };
  if (/^3[1-6]\d{2}$/.test(ai)) return { fixed: 6 }; // measures: weight, length… with a decimal-point digit
  return null;
}

/** Parses "(01)09501101530003(17)261231(10)ABC" into [AI, data] pairs, checking each against its rule */
export function parseGs1(input: string): { ai: string; data: string; variable: boolean }[] {
  const parts = Array.from(input.trim().matchAll(/\((\d{2,4})\)([^()]*)/g));
  if (!parts.length || parts.map((m) => m[0]).join("") !== input.trim()) {
    throw new Error("Write GS1-128 data with each Application Identifier in brackets, like (01)09501101530003(10)ABC123.");
  }
  return parts.map((m) => {
    const ai = m[1];
    const data = m[2];
    const rule = aiRule(ai);
    if (!rule) throw new Error(`(${ai}) isn't an Application Identifier this generator knows.`);
    if (!data) throw new Error(`(${ai}) has no data after it.`);
    if ("fixed" in rule) {
      if (data.length !== rule.fixed || !/^\d+$/.test(data)) throw new Error(`(${ai}) needs exactly ${rule.fixed} digits.`);
      if (ai === "00" || ai === "01" || ai === "02") {
        const check = gs1CheckDigit(data.slice(0, -1));
        if (Number(data[data.length - 1]) !== check) throw new Error(`(${ai}) has the wrong check digit: expected ${check}, got ${data[data.length - 1]}.`);
      }
    } else if (data.length > rule.max) {
      throw new Error(`(${ai}) can be at most ${rule.max} characters.`);
    }
    return { ai, data, variable: "max" in rule };
  });
}

const isDigit = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";

/** GS1-128: Code 128 starting with FNC1, using Code Set C for digit runs and Set B for everything else */
export function encodeGS1128(input: string): BarcodeResult {
  const fields = parseGs1(input);
  // The element string, with \u001d marking the FNC1 that ends a variable-length field (not needed at the very end)
  const stream = fields.map((f, i) => f.ai + f.data + (f.variable && i < fields.length - 1 ? "\u001d" : "")).join("");
  for (const ch of stream) {
    const c = ch.charCodeAt(0);
    if (ch !== "\u001d" && (c < 32 || c > 126)) throw new Error(`GS1-128 only supports printable ASCII characters — "${ch}" is not supported.`);
  }
  const digitRun = (from: number) => {
    let n = 0;
    while (isDigit(stream[from + n])) n++;
    return n;
  };
  let inC = digitRun(0) >= 2;
  const values = [inC ? CODE128_START_C : CODE128_START_B, CODE128_FNC1];
  for (let i = 0; i < stream.length; ) {
    const ch = stream[i];
    if (ch === "\u001d") {
      values.push(CODE128_FNC1); // the same symbol in both code sets
      i++;
      continue;
    }
    const run = digitRun(i);
    if (inC) {
      if (run >= 2) {
        values.push(Number(stream.slice(i, i + 2)));
        i += 2;
      } else {
        values.push(CODE128_TO_B);
        inC = false;
      }
    } else if (run >= 4) {
      // Only worth switching for at least two pairs
      values.push(CODE128_TO_C);
      inC = true;
    } else {
      values.push(ch.charCodeAt(0) - 32);
      i++;
    }
  }
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) checksum += values[i] * i;
  values.push(checksum % 103);
  values.push(CODE128_STOP);
  return { modules: values.map((v) => CODE128_BARS[v]).join(""), displayText: fields.map((f) => `(${f.ai})${f.data}`).join("") };
}

/** A complete SVG of a barcode with its text line. The text is escaped: Code 128 can encode < and & */
export function barcodeSvg(result: BarcodeResult, barWidth = 2, height = 80): string {
  const quietZone = barWidth * 10;
  const textHeight = 20;
  const width = result.modules.length * barWidth + quietZone * 2;
  const totalHeight = height + textHeight;
  let rects = "";
  for (let i = 0; i < result.modules.length; i++) {
    if (result.modules[i] === "1") rects += `<rect x="${quietZone + i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
  }
  const text = result.displayText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}"><rect width="${width}" height="${totalHeight}" fill="#fff"/>${rects}<text x="${width / 2}" y="${height + 16}" font-family="monospace" font-size="14" text-anchor="middle" fill="#000">${text}</text></svg>`;
}

export function generateBarcode(format: BarcodeFormat, input: string): BarcodeResult {
  switch (format) {
    case "gs1128":
      return encodeGS1128(input);
    case "code128":
      return encodeCode128(input);
    case "ean13":
      return encodeEAN13(input);
    case "upca":
      return encodeUPCA(input);
    case "ean8":
      return encodeEAN8(input);
    case "code39":
      return encodeCode39(input);
    case "itf14":
      return encodeITF14(input);
  }
}
