export interface IbanCountry {
  code: string;
  name: string;
  length: number;
}

// ISO 13616 / IBAN registry — fixed total length (including the 2-letter country code and
// 2-digit check digits) per country. Covers the commonly-encountered IBAN countries; not
// every IBAN-using country in the world is listed.
export const IBAN_COUNTRIES: IbanCountry[] = [
  { code: "AD", name: "Andorra", length: 24 },
  { code: "AE", name: "United Arab Emirates", length: 23 },
  { code: "AT", name: "Austria", length: 20 },
  { code: "BE", name: "Belgium", length: 16 },
  { code: "BG", name: "Bulgaria", length: 22 },
  { code: "CH", name: "Switzerland", length: 21 },
  { code: "CY", name: "Cyprus", length: 28 },
  { code: "CZ", name: "Czech Republic", length: 24 },
  { code: "DE", name: "Germany", length: 22 },
  { code: "DK", name: "Denmark", length: 18 },
  { code: "EE", name: "Estonia", length: 20 },
  { code: "ES", name: "Spain", length: 24 },
  { code: "FI", name: "Finland", length: 18 },
  { code: "FR", name: "France", length: 27 },
  { code: "GB", name: "United Kingdom", length: 22 },
  { code: "GR", name: "Greece", length: 27 },
  { code: "HR", name: "Croatia", length: 21 },
  { code: "HU", name: "Hungary", length: 28 },
  { code: "IE", name: "Ireland", length: 22 },
  { code: "IS", name: "Iceland", length: 26 },
  { code: "IT", name: "Italy", length: 27 },
  { code: "LI", name: "Liechtenstein", length: 21 },
  { code: "LT", name: "Lithuania", length: 20 },
  { code: "LU", name: "Luxembourg", length: 20 },
  { code: "LV", name: "Latvia", length: 21 },
  { code: "MC", name: "Monaco", length: 27 },
  { code: "MT", name: "Malta", length: 31 },
  { code: "NL", name: "Netherlands", length: 18 },
  { code: "NO", name: "Norway", length: 15 },
  { code: "PL", name: "Poland", length: 28 },
  { code: "PT", name: "Portugal", length: 25 },
  { code: "RO", name: "Romania", length: 24 },
  { code: "SE", name: "Sweden", length: 24 },
  { code: "SI", name: "Slovenia", length: 19 },
  { code: "SK", name: "Slovakia", length: 24 },
  { code: "SM", name: "San Marino", length: 27 },
];

const COUNTRY_LENGTH_MAP = new Map(IBAN_COUNTRIES.map((c) => [c.code, c.length]));

/** Converts a rearranged IBAN string to the digit string used by the MOD-97 check
 * (ISO 7064 MOD 97-10): map each letter to two digits (A=10 ... Z=35). */
function toNumericString(rearranged: string): string {
  let out = "";
  for (const ch of rearranged) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else {
      out += (ch.charCodeAt(0) - 55).toString();
    }
  }
  return out;
}

/** Computes numeric-string mod 97, processing in chunks so it works for arbitrarily long IBANs
 * without needing arbitrary-precision math. */
function mod97(numericStr: string): number {
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i += 7) {
    const chunk = String(remainder) + numericStr.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder;
}

export function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

export interface IbanValidation {
  valid: boolean;
  countryCode: string;
  countryName: string | null;
  checkDigits: string;
  bban: string;
  lengthOk: boolean | null; // null = country not in our length table, can't confirm
  error?: string;
}

export function validateIban(input: string): IbanValidation {
  const clean = input.replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return {
      valid: false,
      countryCode: clean.slice(0, 2),
      countryName: null,
      checkDigits: clean.slice(2, 4),
      bban: clean.slice(4),
      lengthOk: null,
      error: "Must start with a 2-letter country code and 2-digit check number, followed by the BBAN.",
    };
  }

  const countryCode = clean.slice(0, 2);
  const checkDigits = clean.slice(2, 4);
  const bban = clean.slice(4);
  const expectedLength = COUNTRY_LENGTH_MAP.get(countryCode);
  const lengthOk = expectedLength === undefined ? null : expectedLength === clean.length;
  const countryName = IBAN_COUNTRIES.find((c) => c.code === countryCode)?.name ?? null;

  const rearranged = bban + countryCode + checkDigits;
  const numeric = toNumericString(rearranged);
  const remainder = mod97(numeric);

  return {
    valid: remainder === 1 && lengthOk !== false,
    countryCode,
    countryName,
    checkDigits,
    bban,
    lengthOk,
    error: remainder !== 1 ? "Failed the MOD-97 checksum." : lengthOk === false ? `Expected ${expectedLength} characters for ${countryCode}, got ${clean.length}.` : undefined,
  };
}

function randomDigits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

/** Generates a MOD-97-valid test IBAN for the given country — random BBAN digits with
 * correctly computed check digits. Not a real, bank-issued account number. */
export function generateTestIban(countryCode: string): string {
  const country = IBAN_COUNTRIES.find((c) => c.code === countryCode);
  if (!country) throw new Error(`Unknown country code: ${countryCode}`);

  const bbanLength = country.length - 4;
  const bban = randomDigits(bbanLength);

  // Check digits: rearrange as BBAN + country + "00", convert, mod 97, then 98 - remainder.
  const rearranged = bban + countryCode + "00";
  const numeric = toNumericString(rearranged);
  const remainder = mod97(numeric);
  const checkDigits = String(98 - remainder).padStart(2, "0");

  return countryCode + checkDigits + bban;
}
