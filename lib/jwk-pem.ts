function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToPem(buf: ArrayBuffer, label: string): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

// RSA key-shape DER encoding is identical regardless of the intended signing hash, so any hash
// works purely for import/export — it's never used to derive the exported key bytes.
const CANDIDATE_ALGORITHMS: (RsaHashedImportParams | EcKeyImportParams)[] = [
  { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  { name: "ECDSA", namedCurve: "P-256" },
  { name: "ECDSA", namedCurve: "P-384" },
  { name: "ECDSA", namedCurve: "P-521" },
];

async function importAny(format: "spki" | "pkcs8", data: ArrayBuffer, usage: "verify" | "sign") {
  for (const alg of CANDIDATE_ALGORITHMS) {
    try {
      return await crypto.subtle.importKey(format, data, alg, true, [usage]);
    } catch {
      // try the next candidate algorithm
    }
  }
  throw new Error(
    "Couldn't read this as an RSA or EC key. Only RSA and EC (P-256/P-384/P-521) keys are supported."
  );
}

export type KeyClass = "public" | "private";

export async function pemToJwk(pem: string, keyClass: KeyClass): Promise<JsonWebKey> {
  const der = pemToArrayBuffer(pem);
  const key =
    keyClass === "public"
      ? await importAny("spki", der, "verify")
      : await importAny("pkcs8", der, "sign");
  return crypto.subtle.exportKey("jwk", key);
}

export async function jwkToPem(jwk: JsonWebKey, keyClass: KeyClass): Promise<string> {
  let algorithm: RsaHashedImportParams | EcKeyImportParams;
  if (jwk.kty === "RSA") {
    algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  } else if (jwk.kty === "EC") {
    if (!jwk.crv) throw new Error("JWK is missing the 'crv' (curve) field required for EC keys.");
    algorithm = { name: "ECDSA", namedCurve: jwk.crv };
  } else {
    throw new Error(`Unsupported key type "${jwk.kty}". Only RSA and EC keys are supported.`);
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    algorithm,
    true,
    [keyClass === "public" ? "verify" : "sign"]
  );

  const exported =
    keyClass === "public"
      ? await crypto.subtle.exportKey("spki", key)
      : await crypto.subtle.exportKey("pkcs8", key);

  return arrayBufferToPem(exported, keyClass === "public" ? "PUBLIC KEY" : "PRIVATE KEY");
}

export function detectKeyClass(input: string): KeyClass | null {
  const trimmed = input.trim();
  if (trimmed.startsWith("-----BEGIN PUBLIC KEY-----")) return "public";
  if (trimmed.startsWith("-----BEGIN PRIVATE KEY-----")) return "private";
  try {
    const jwk = JSON.parse(trimmed) as JsonWebKey;
    if (jwk.d) return "private";
    if (jwk.kty) return "public";
  } catch {
    // not JSON
  }
  return null;
}
