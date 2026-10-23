import { PASSPHRASE_WORDS } from "./passphrase-words";

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export function generatePassphrase(opts: PassphraseOptions): string {
  const arr = new Uint32Array(opts.wordCount);
  crypto.getRandomValues(arr);
  let words = Array.from(arr, (n) => PASSPHRASE_WORDS[n % PASSPHRASE_WORDS.length]);
  if (opts.capitalize) {
    words = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  }
  let result = words.join(opts.separator);
  if (opts.includeNumber) {
    const numArr = new Uint32Array(1);
    crypto.getRandomValues(numArr);
    result += opts.separator + (numArr[0] % 100);
  }
  return result;
}

export function passphraseEntropyBits(wordCount: number, includeNumber: boolean): number {
  const bitsPerWord = Math.log2(PASSPHRASE_WORDS.length);
  return wordCount * bitsPerWord + (includeNumber ? Math.log2(100) : 0);
}
