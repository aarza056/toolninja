export type SshKeyType = "ed25519" | "rsa";

export interface SshKeyPairResult {
  type: SshKeyType;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  privateKeyFormat: "OpenSSH" | "PKCS8 PEM";
}

class ByteWriter {
  private chunks: Uint8Array[] = [];
  bytes(b: Uint8Array): this {
    this.chunks.push(b);
    return this;
  }
  uint32(n: number): this {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);
    return this.bytes(b);
  }
  string(strOrBytes: string | Uint8Array): this {
    const b = typeof strOrBytes === "string" ? new TextEncoder().encode(strOrBytes) : strOrBytes;
    this.uint32(b.length);
    return this.bytes(b);
  }
  toBytes(): Uint8Array {
    const total = this.chunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of this.chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function wrapBase64(b64: string, width = 70): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += width) lines.push(b64.slice(i, i + width));
  return lines.join("\n");
}

function base64UrlToBytes(s: string): Uint8Array {
  const clean = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** SSH "mpint" wire encoding: big-endian, minimal, with a leading zero byte if the high bit is set. */
function mpint(bytes: Uint8Array): Uint8Array {
  let i = 0;
  while (i < bytes.length - 1 && bytes[i] === 0) i++;
  let trimmed = bytes.slice(i);
  if (trimmed[0] & 0x80) {
    const withZero = new Uint8Array(trimmed.length + 1);
    withZero.set(trimmed, 1);
    trimmed = withZero;
  }
  return trimmed;
}

async function sha256Fingerprint(pubBlob: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", pubBlob as BufferSource));
  return `SHA256:${toBase64(digest).replace(/=+$/, "")}`;
}

async function generateEd25519(comment: string): Promise<SshKeyPairResult> {
  const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  const rawPub = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
  // Ed25519 PKCS8 (RFC 8410) is always exactly 48 bytes: a fixed 16-byte prefix + the 32-byte seed.
  const rawSeed = pkcs8.slice(pkcs8.length - 32);

  const pubBlob = new ByteWriter().string("ssh-ed25519").string(rawPub).toBytes();
  const publicKey = `ssh-ed25519 ${toBase64(pubBlob)}${comment ? " " + comment : ""}`;

  const checkint = crypto.getRandomValues(new Uint8Array(4));
  const combined = new Uint8Array(64);
  combined.set(rawSeed, 0);
  combined.set(rawPub, 32);

  const privSectionWriter = new ByteWriter()
    .bytes(checkint)
    .bytes(checkint)
    .string("ssh-ed25519")
    .string(rawPub)
    .string(combined)
    .string(comment);

  const preLen = privSectionWriter.toBytes().length;
  const padLen = (8 - (preLen % 8)) % 8;
  for (let i = 1; i <= padLen; i++) privSectionWriter.bytes(new Uint8Array([i & 0xff]));

  const outer = new ByteWriter()
    .bytes(new TextEncoder().encode("openssh-key-v1\0"))
    .string("none")
    .string("none")
    .string("")
    .uint32(1)
    .string(pubBlob)
    .string(privSectionWriter.toBytes());

  const privateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrapBase64(toBase64(outer.toBytes()))}\n-----END OPENSSH PRIVATE KEY-----\n`;

  return {
    type: "ed25519",
    publicKey,
    privateKey,
    fingerprint: await sha256Fingerprint(pubBlob),
    privateKeyFormat: "OpenSSH",
  };
}

async function generateRsa(modulusLength: number, comment: string): Promise<SshKeyPairResult> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  )) as CryptoKeyPair;

  const jwkPub = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const n = mpint(base64UrlToBytes(jwkPub.n!));
  const e = mpint(base64UrlToBytes(jwkPub.e!));

  const pubBlob = new ByteWriter().string("ssh-rsa").string(e).string(n).toBytes();
  const publicKey = `ssh-rsa ${toBase64(pubBlob)}${comment ? " " + comment : ""}`;

  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${wrapBase64(toBase64(pkcs8), 64)}\n-----END PRIVATE KEY-----\n`;

  return {
    type: "rsa",
    publicKey,
    privateKey,
    fingerprint: await sha256Fingerprint(pubBlob),
    privateKeyFormat: "PKCS8 PEM",
  };
}

export async function generateSshKeyPair(type: SshKeyType, opts: { rsaModulusLength?: number; comment?: string } = {}): Promise<SshKeyPairResult> {
  const comment = opts.comment ?? "";
  if (type === "ed25519") return generateEd25519(comment);
  return generateRsa(opts.rsaModulusLength ?? 2048, comment);
}

