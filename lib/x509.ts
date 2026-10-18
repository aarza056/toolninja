interface Node {
  tag: number;
  start: number; // offset of the tag byte
  contentStart: number;
  contentEnd: number;
  constructed: boolean;
}

function readNode(buf: Uint8Array, pos: number): Node {
  if (pos + 2 > buf.length) throw new Error("Truncated DER data");
  const tag = buf[pos];
  let len = buf[pos + 1];
  let offset = pos + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) throw new Error("Unsupported DER length encoding");
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + buf[offset + i];
    offset += n;
  }
  if (offset + len > buf.length) throw new Error("Truncated DER data");
  return { tag, start: pos, contentStart: offset, contentEnd: offset + len, constructed: (tag & 0x20) !== 0 };
}

function children(buf: Uint8Array, node: Node): Node[] {
  const out: Node[] = [];
  let pos = node.contentStart;
  while (pos < node.contentEnd) {
    const child = readNode(buf, pos);
    out.push(child);
    pos = child.contentEnd;
  }
  return out;
}

function content(buf: Uint8Array, node: Node): Uint8Array {
  return buf.slice(node.contentStart, node.contentEnd);
}

function decodeOid(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const parts: number[] = [Math.floor(bytes[0] / 40), bytes[0] % 40];
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = value * 128 + (bytes[i] & 0x7f);
    if ((bytes[i] & 0x80) === 0) {
      parts.push(value);
      value = 0;
    }
  }
  return parts.join(".");
}

function toHex(bytes: Uint8Array, sep = ""): string {
  const out: string[] = [];
  for (let i = 0; i < bytes.length; i++) out.push(bytes[i].toString(16).padStart(2, "0"));
  return out.join(sep);
}

function decodeString(buf: Uint8Array, node: Node): string {
  const bytes = content(buf, node);
  if (node.tag === 0x0c) return new TextDecoder("utf-8").decode(bytes);
  if (node.tag === 0x1e) {
    let s = "";
    for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    return s;
  }
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function decodeTime(buf: Uint8Array, node: Node): Date {
  const s = decodeString(buf, node);
  let year: number;
  let rest: string;
  if (node.tag === 0x17) {
    const yy = parseInt(s.slice(0, 2), 10);
    year = yy >= 50 ? 1900 + yy : 2000 + yy;
    rest = s.slice(2);
  } else {
    year = parseInt(s.slice(0, 4), 10);
    rest = s.slice(4);
  }
  const month = parseInt(rest.slice(0, 2), 10) - 1;
  const day = parseInt(rest.slice(2, 4), 10);
  const hour = parseInt(rest.slice(4, 6), 10);
  const min = parseInt(rest.slice(6, 8), 10);
  const sec = parseInt(rest.slice(8, 10), 10) || 0;
  return new Date(Date.UTC(year, month, day, hour, min, sec));
}

const OID_NAMES: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.5": "serialNumber",
  "2.5.4.97": "organizationIdentifier",
  "1.2.840.113549.1.9.1": "emailAddress",
  "1.3.6.1.4.1.311.60.2.1.3": "jurisdictionC",
  "2.5.4.15": "businessCategory",
};

const SIG_ALGS: Record<string, string> = {
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
};

const CURVES: Record<string, string> = {
  "1.2.840.10045.3.1.7": "P-256",
  "1.3.132.0.34": "P-384",
  "1.3.132.0.35": "P-521",
};

const EXT_NAMES: Record<string, string> = {
  "2.5.29.14": "Subject Key Identifier",
  "2.5.29.15": "Key Usage",
  "2.5.29.17": "Subject Alternative Name",
  "2.5.29.19": "Basic Constraints",
  "2.5.29.31": "CRL Distribution Points",
  "2.5.29.32": "Certificate Policies",
  "2.5.29.35": "Authority Key Identifier",
  "2.5.29.37": "Extended Key Usage",
  "1.3.6.1.5.5.7.1.1": "Authority Information Access",
  "1.3.6.1.4.1.11129.2.4.2": "Signed Certificate Timestamps",
};

const EKU_NAMES: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "TLS Web Server Authentication",
  "1.3.6.1.5.5.7.3.2": "TLS Web Client Authentication",
  "1.3.6.1.5.5.7.3.3": "Code Signing",
  "1.3.6.1.5.5.7.3.4": "Email Protection",
  "1.3.6.1.5.5.7.3.8": "Time Stamping",
  "1.3.6.1.5.5.7.3.9": "OCSP Signing",
};

const KEY_USAGE_BITS = [
  "Digital Signature",
  "Non Repudiation",
  "Key Encipherment",
  "Data Encipherment",
  "Key Agreement",
  "Certificate Sign",
  "CRL Sign",
  "Encipher Only",
  "Decipher Only",
];

export interface DnPart {
  type: string;
  value: string;
}

export interface CertExtension {
  oid: string;
  name: string;
  critical: boolean;
  values: string[];
}

export interface DecodedCert {
  version: number;
  serial: string;
  signatureAlgorithm: string;
  issuer: DnPart[];
  subject: DnPart[];
  notBefore: Date;
  notAfter: Date;
  publicKey: string;
  subjectAltNames: string[];
  isCa: boolean;
  extensions: CertExtension[];
  sha256: string;
  sha1: string;
}

function parseName(buf: Uint8Array, node: Node): DnPart[] {
  const parts: DnPart[] = [];
  for (const rdnSet of children(buf, node)) {
    for (const atv of children(buf, rdnSet)) {
      const [typeNode, valueNode] = children(buf, atv);
      const oid = decodeOid(content(buf, typeNode));
      parts.push({ type: OID_NAMES[oid] ?? oid, value: decodeString(buf, valueNode) });
    }
  }
  return parts;
}

function bitLength(bytes: Uint8Array): number {
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) i++;
  if (i === bytes.length) return 0;
  return (bytes.length - i - 1) * 8 + (32 - Math.clz32(bytes[i]));
}

function describePublicKey(buf: Uint8Array, spki: Node): string {
  const [algId, keyBits] = children(buf, spki);
  const algChildren = children(buf, algId);
  const algOid = decodeOid(content(buf, algChildren[0]));
  if (algOid === "1.2.840.113549.1.1.1") {
    // BIT STRING: skip the unused-bits byte, then SEQUENCE { modulus, exponent }
    const seq = readNode(buf, keyBits.contentStart + 1);
    const [modulus, exponent] = children(buf, seq);
    const exp = content(buf, exponent);
    let e = 0;
    for (let i = 0; i < exp.length; i++) e = e * 256 + exp[i];
    return `RSA ${bitLength(content(buf, modulus))}-bit (e=${e})`;
  }
  if (algOid === "1.2.840.10045.2.1") {
    const curveOid = algChildren[1] ? decodeOid(content(buf, algChildren[1])) : "";
    return `EC ${CURVES[curveOid] ?? curveOid}`;
  }
  if (algOid === "1.3.101.112") return "Ed25519";
  if (algOid === "1.3.101.113") return "Ed448";
  return algOid;
}

function decodeGeneralNames(buf: Uint8Array, seq: Node): string[] {
  return children(buf, seq).map((gn) => {
    const bytes = content(buf, gn);
    const ctx = gn.tag & 0x1f;
    if (ctx === 2) return `DNS:${decodeString(buf, gn)}`;
    if (ctx === 1) return `email:${decodeString(buf, gn)}`;
    if (ctx === 6) return `URI:${decodeString(buf, gn)}`;
    if (ctx === 7) {
      if (bytes.length === 4) return `IP:${Array.from(bytes).join(".")}`;
      const groups: string[] = [];
      for (let i = 0; i < bytes.length; i += 2) groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
      return `IP:${groups.join(":")}`;
    }
    return `other:${toHex(bytes)}`;
  });
}

function decodeExtension(buf: Uint8Array, ext: Node): CertExtension {
  const parts = children(buf, ext);
  const oid = decodeOid(content(buf, parts[0]));
  let critical = false;
  let valueNode = parts[1];
  if (parts[1].tag === 0x01) {
    critical = buf[parts[1].contentStart] !== 0;
    valueNode = parts[2];
  }
  const inner = readNode(buf, valueNode.contentStart);
  let values: string[] = [];

  try {
    if (oid === "2.5.29.17") {
      values = decodeGeneralNames(buf, inner);
    } else if (oid === "2.5.29.19") {
      const kids = children(buf, inner);
      const ca = kids[0]?.tag === 0x01 && buf[kids[0].contentStart] !== 0;
      values = [`CA: ${ca ? "TRUE" : "FALSE"}`];
      const pathLenNode = kids.find((k) => k.tag === 0x02);
      if (pathLenNode) values.push(`Path length: ${buf[pathLenNode.contentStart]}`);
    } else if (oid === "2.5.29.15") {
      const bytes = content(buf, inner);
      for (let bit = 0; bit < KEY_USAGE_BITS.length; bit++) {
        const byte = bytes[1 + Math.floor(bit / 8)];
        if (byte !== undefined && byte & (0x80 >> bit % 8)) values.push(KEY_USAGE_BITS[bit]);
      }
    } else if (oid === "2.5.29.37") {
      values = children(buf, inner).map((n) => {
        const o = decodeOid(content(buf, n));
        return EKU_NAMES[o] ?? o;
      });
    } else if (oid === "2.5.29.14") {
      values = [toHex(content(buf, inner), ":").toUpperCase()];
    } else if (oid === "2.5.29.35") {
      const keyId = children(buf, inner).find((n) => (n.tag & 0x1f) === 0 && !n.constructed);
      if (keyId) values = [toHex(content(buf, keyId), ":").toUpperCase()];
    }
  } catch {
    values = [];
  }

  return { oid, name: EXT_NAMES[oid] ?? oid, critical, values };
}

function pemBlocks(input: string): Uint8Array[] {
  const blocks: Uint8Array[] = [];
  const re = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    const b64 = m[1].replace(/\s+/g, "");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    blocks.push(bytes);
  }
  return blocks;
}

async function digestHex(alg: "SHA-256" | "SHA-1", bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest(alg, bytes as BufferSource));
  return toHex(d, ":").toUpperCase();
}

async function decodeOne(der: Uint8Array): Promise<DecodedCert> {
  const cert = readNode(der, 0);
  const [tbs, sigAlg] = children(der, cert);
  const tbsKids = children(der, tbs);

  let i = 0;
  let version = 1;
  if (tbsKids[0].tag === 0xa0) {
    const vNode = children(der, tbsKids[0])[0];
    version = der[vNode.contentStart] + 1;
    i++;
  }
  let serialBytes = content(der, tbsKids[i++]);
  // DER INTEGERs carry a leading 0x00 when the high bit is set; it's sign padding, not part of the serial
  if (serialBytes.length > 1 && serialBytes[0] === 0) serialBytes = serialBytes.slice(1);
  const serial = toHex(serialBytes, ":").toUpperCase();
  i++; // inner signature algorithm (duplicates the outer one)
  const issuer = parseName(der, tbsKids[i++]);
  const [nb, na] = children(der, tbsKids[i++]);
  const subject = parseName(der, tbsKids[i++]);
  const spki = tbsKids[i++];

  const extensions: CertExtension[] = [];
  for (; i < tbsKids.length; i++) {
    if (tbsKids[i].tag === 0xa3) {
      const extSeq = children(der, tbsKids[i])[0];
      for (const ext of children(der, extSeq)) extensions.push(decodeExtension(der, ext));
    }
  }

  const sigOid = decodeOid(content(der, children(der, sigAlg)[0]));
  const san = extensions.find((e) => e.oid === "2.5.29.17");
  const bc = extensions.find((e) => e.oid === "2.5.29.19");

  return {
    version,
    serial,
    signatureAlgorithm: SIG_ALGS[sigOid] ?? sigOid,
    issuer,
    subject,
    notBefore: decodeTime(der, nb),
    notAfter: decodeTime(der, na),
    publicKey: describePublicKey(der, spki),
    subjectAltNames: san?.values ?? [],
    isCa: bc?.values[0] === "CA: TRUE",
    extensions,
    sha256: await digestHex("SHA-256", der),
    sha1: await digestHex("SHA-1", der),
  };
}

export async function decodeCertificates(input: string): Promise<DecodedCert[]> {
  const blocks = pemBlocks(input);
  if (blocks.length === 0) throw new Error("No -----BEGIN CERTIFICATE----- block found");
  const out: DecodedCert[] = [];
  for (let i = 0; i < blocks.length; i++) {
    try {
      out.push(await decodeOne(blocks[i]));
    } catch (e) {
      throw new Error(`Certificate ${i + 1}: ${e instanceof Error ? e.message : "could not be decoded"}`);
    }
  }
  return out;
}

export function formatDn(parts: DnPart[]): string {
  return parts.map((p) => `${p.type}=${p.value}`).join(", ");
}
