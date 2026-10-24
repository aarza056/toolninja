import { base32Decode, base32Encode, buildOtpauthUrl, type TotpAlgorithm } from "@/lib/totp";

// Google Authenticator's "Transfer accounts" QR codes hold an otpauth-migration://offline?data=… link.
// `data` is a base64 protobuf (MigrationPayload) with every account's secret in it. Other apps
// (Bitwarden, 1Password, Aegis…) want one standard otpauth:// link per account, so we decode it here.
//
// message MigrationPayload { repeated OtpParameters otp_parameters = 1; int32 version = 2;
//   int32 batch_size = 3; int32 batch_index = 4; int32 batch_id = 5; }
// message OtpParameters { bytes secret = 1; string name = 2; string issuer = 3;
//   Algorithm algorithm = 4; DigitCount digits = 5; OtpType type = 6; int64 counter = 7; }
// Algorithm: 1 SHA1, 2 SHA256, 3 SHA512, 4 MD5 · DigitCount: 1 six, 2 eight · OtpType: 1 HOTP, 2 TOTP

export type OtpKind = "totp" | "hotp";
export type MigrationAlgorithm = TotpAlgorithm | "MD5";

export interface MigrationAccount {
  /** Base32, no padding — what authenticator apps expect */
  secret: string;
  /** Account name without the "Issuer:" prefix */
  account: string;
  issuer: string;
  algorithm: MigrationAlgorithm;
  digits: 6 | 8;
  type: OtpKind;
  counter: number;
}

export interface MigrationBatch {
  accounts: MigrationAccount[];
  version: number;
  batchSize: number;
  batchIndex: number;
  batchId: number;
}

// ─── protobuf (just the wire types this message uses) ─────────────────────────

class Reader {
  pos = 0;
  constructor(private buf: Uint8Array) {}
  get done() {
    return this.pos >= this.buf.length;
  }
  varint(): number {
    // Values here are small (enums, counters); read up to 64 bits into a double safely
    let result = 0;
    let mul = 1;
    for (let i = 0; i < 10; i++) {
      if (this.pos >= this.buf.length) throw new Error("Truncated data");
      const b = this.buf[this.pos++];
      result += (b & 0x7f) * mul;
      if (!(b & 0x80)) return result;
      mul *= 128;
    }
    throw new Error("Invalid varint");
  }
  bytes(): Uint8Array {
    const len = this.varint();
    if (this.pos + len > this.buf.length) throw new Error("Truncated data");
    const out = this.buf.subarray(this.pos, this.pos + len);
    this.pos += len;
    return out;
  }
  skip(wireType: number) {
    if (wireType === 0) this.varint();
    else if (wireType === 1) this.pos += 8;
    else if (wireType === 2) this.bytes();
    else if (wireType === 5) this.pos += 4;
    else throw new Error(`Unsupported wire type ${wireType}`);
  }
}

const utf8 = (b: Uint8Array) => new TextDecoder().decode(b);
const ALGORITHMS: Record<number, MigrationAlgorithm> = { 0: "SHA-1", 1: "SHA-1", 2: "SHA-256", 3: "SHA-512", 4: "MD5" };

function readAccount(buf: Uint8Array): MigrationAccount {
  const r = new Reader(buf);
  let secret: Uint8Array = new Uint8Array();
  let name = "";
  let issuer = "";
  let algorithm = 1;
  let digits = 1;
  let type = 2;
  let counter = 0;
  while (!r.done) {
    const key = r.varint();
    const field = Math.floor(key / 8);
    const wire = key & 7;
    if (field === 1 && wire === 2) secret = r.bytes();
    else if (field === 2 && wire === 2) name = utf8(r.bytes());
    else if (field === 3 && wire === 2) issuer = utf8(r.bytes());
    else if (field === 4 && wire === 0) algorithm = r.varint();
    else if (field === 5 && wire === 0) digits = r.varint();
    else if (field === 6 && wire === 0) type = r.varint();
    else if (field === 7 && wire === 0) counter = r.varint();
    else r.skip(wire);
  }
  // Names are usually "Issuer:account"; drop the prefix when it repeats the issuer
  let account = name;
  const colon = name.indexOf(":");
  if (colon > 0) {
    const prefix = name.slice(0, colon).trim();
    if (!issuer) issuer = prefix;
    if (prefix === issuer) account = name.slice(colon + 1).trim();
  }
  return {
    secret: base32Encode(secret).replace(/=+$/, ""),
    account,
    issuer,
    algorithm: ALGORITHMS[algorithm] ?? "SHA-1",
    digits: digits === 2 ? 8 : 6,
    type: type === 1 ? "hotp" : "totp",
    counter,
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Decodes an otpauth-migration:// link (or just its data= value). Throws with a readable message. */
export function decodeMigration(input: string): MigrationBatch {
  const text = input.trim();
  let data = text;
  if (/^otpauth-migration:/i.test(text)) {
    const m = text.match(/[?&]data=([^&#\s]+)/);
    if (!m) throw new Error("This link has no data= part.");
    data = m[1];
  } else if (/^otpauth:\/\//i.test(text)) {
    throw new Error("This is a single-account otpauth:// link, not a Google Authenticator export — open it in the TOTP generator.");
  }
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(decodeURIComponent(data));
  } catch {
    throw new Error("The data isn't valid base64 — the link may have been cut off when copying.");
  }
  const r = new Reader(bytes);
  const batch: MigrationBatch = { accounts: [], version: 0, batchSize: 1, batchIndex: 0, batchId: 0 };
  try {
    while (!r.done) {
      const key = r.varint();
      const field = Math.floor(key / 8);
      const wire = key & 7;
      if (field === 1 && wire === 2) batch.accounts.push(readAccount(r.bytes()));
      else if (field === 2 && wire === 0) batch.version = r.varint();
      else if (field === 3 && wire === 0) batch.batchSize = r.varint();
      else if (field === 4 && wire === 0) batch.batchIndex = r.varint();
      else if (field === 5 && wire === 0) batch.batchId = r.varint();
      else r.skip(wire);
    }
  } catch (e) {
    throw new Error(`Couldn't read the export data (${e instanceof Error ? e.message : "invalid"}). Scan the QR code again.`);
  }
  if (!batch.accounts.length) throw new Error("The export contains no accounts.");
  return batch;
}

/** Standard otpauth:// link for one account — importable by any authenticator app. */
export function accountToOtpauth(a: MigrationAccount): string {
  if (a.type === "totp" && a.algorithm !== "MD5") {
    return buildOtpauthUrl(a.secret, a.account, a.issuer, { algorithm: a.algorithm, digits: a.digits, period: 30 });
  }
  const label = encodeURIComponent(a.issuer ? `${a.issuer}:${a.account}` : a.account);
  const params = new URLSearchParams({ secret: a.secret });
  if (a.issuer) params.set("issuer", a.issuer);
  params.set("algorithm", a.algorithm.replace("-", ""));
  params.set("digits", String(a.digits));
  if (a.type === "hotp") params.set("counter", String(a.counter));
  else params.set("period", "30");
  return `otpauth://${a.type}/${label}?${params.toString()}`;
}

// ─── encoding (to move accounts *into* Google Authenticator in one scan) ──────

function varint(n: number): number[] {
  const out: number[] = [];
  let v = Math.max(0, Math.floor(n));
  do {
    let b = v % 128;
    v = Math.floor(v / 128);
    if (v > 0) b |= 0x80;
    out.push(b);
  } while (v > 0);
  return out;
}

const field = (num: number, wire: number) => varint(num * 8 + wire);
const lenDelim = (num: number, bytes: Uint8Array | number[]) => [...field(num, 2), ...varint(bytes.length), ...Array.from(bytes)];
const enc = (s: string) => Array.from(new TextEncoder().encode(s));
const ALGO_CODE: Record<MigrationAlgorithm, number> = { "SHA-1": 1, "SHA-256": 2, "SHA-512": 3, MD5: 4 };

export function encodeMigration(accounts: MigrationAccount[], batch = { index: 0, size: 1, id: 0 }): string {
  const bytes: number[] = [];
  for (const a of accounts) {
    const secret = Array.from(base32Decode(a.secret));
    const name = a.issuer ? `${a.issuer}:${a.account}` : a.account;
    const p = [
      ...lenDelim(1, secret),
      ...lenDelim(2, enc(name)),
      ...(a.issuer ? lenDelim(3, enc(a.issuer)) : []),
      ...field(4, 0), ...varint(ALGO_CODE[a.algorithm]),
      ...field(5, 0), ...varint(a.digits === 8 ? 2 : 1),
      ...field(6, 0), ...varint(a.type === "hotp" ? 1 : 2),
      ...(a.type === "hotp" ? [...field(7, 0), ...varint(a.counter)] : []),
    ];
    bytes.push(...lenDelim(1, p));
  }
  bytes.push(...field(2, 0), ...varint(1), ...field(3, 0), ...varint(batch.size), ...field(4, 0), ...varint(batch.index), ...field(5, 0), ...varint(batch.id));
  return `otpauth-migration://offline?data=${encodeURIComponent(bytesToBase64(new Uint8Array(bytes)))}`;
}
