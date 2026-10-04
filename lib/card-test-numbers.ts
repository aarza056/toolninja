export interface CardNetwork {
  id: string;
  name: string;
  length: number;
  prefixes: string[];
}

export const CARD_NETWORKS: CardNetwork[] = [
  { id: "visa", name: "Visa", length: 16, prefixes: ["4"] },
  { id: "mastercard", name: "Mastercard", length: 16, prefixes: ["51", "52", "53", "54", "55"] },
  { id: "amex", name: "American Express", length: 15, prefixes: ["34", "37"] },
  { id: "discover", name: "Discover", length: 16, prefixes: ["6011", "65"] },
];

function luhnCheckDigit(numberWithoutCheckDigit: string): number {
  let sum = 0;
  let double = true; // the digit immediately to the left of the (not-yet-appended) check digit doubles first
  for (let i = numberWithoutCheckDigit.length - 1; i >= 0; i--) {
    let d = Number(numberWithoutCheckDigit[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

export function luhnIsValid(digits: string): boolean {
  const clean = digits.replace(/\D/g, "");
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const checkDigit = Number(clean[clean.length - 1]);
  return luhnCheckDigit(body) === checkDigit;
}

export function generateTestCardNumber(network: CardNetwork): string {
  const prefix = network.prefixes[Math.floor(Math.random() * network.prefixes.length)];
  let body = prefix;
  while (body.length < network.length - 1) {
    body += Math.floor(Math.random() * 10).toString();
  }
  return body + luhnCheckDigit(body).toString();
}

export function formatCardNumber(number: string): string {
  if (number.length === 15) {
    // Amex groups as 4-6-5
    return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
  }
  return number.match(/.{1,4}/g)?.join(" ") ?? number;
}
