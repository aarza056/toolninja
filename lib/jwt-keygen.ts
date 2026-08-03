export type JwtAlgorithm = "RS256" | "RS384" | "RS512" | "PS256" | "PS384" | "PS512" | "ES256" | "ES384" | "ES512";

export const JWT_ALGORITHMS: { id: JwtAlgorithm; label: string; family: "RSA" | "EC" }[] = [
  { id: "RS256", label: "RS256 (RSASSA-PKCS1-v1_5, SHA-256)", family: "RSA" },
  { id: "RS384", label: "RS384 (RSASSA-PKCS1-v1_5, SHA-384)", family: "RSA" },
  { id: "RS512", label: "RS512 (RSASSA-PKCS1-v1_5, SHA-512)", family: "RSA" },
  { id: "PS256", label: "PS256 (RSA-PSS, SHA-256)", family: "RSA" },
  { id: "PS384", label: "PS384 (RSA-PSS, SHA-384)", family: "RSA" },
  { id: "PS512", label: "PS512 (RSA-PSS, SHA-512)", family: "RSA" },
  { id: "ES256", label: "ES256 (ECDSA, P-256)", family: "EC" },
  { id: "ES384", label: "ES384 (ECDSA, P-384)", family: "EC" },
  { id: "ES512", label: "ES512 (ECDSA, P-521)", family: "EC" },
];

const HASH_MAP: Record<string, string> = {
  RS256: "SHA-256", RS384: "SHA-384", RS512: "SHA-512",
  PS256: "SHA-256", PS384: "SHA-384", PS512: "SHA-512",
};

const CURVE_MAP: Record<string, string> = {
  ES256: "P-256", ES384: "P-384", ES512: "P-521",
};

function getKeyGenParams(alg: JwtAlgorithm, rsaModulusLength: number): RsaHashedKeyGenParams | EcKeyGenParams {
  if (alg.startsWith("RS")) {
    return {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: rsaModulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: HASH_MAP[alg],
    } as RsaHashedKeyGenParams;
  }
  if (alg.startsWith("PS")) {
    return {
      name: "RSA-PSS",
      modulusLength: rsaModulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: HASH_MAP[alg],
    } as RsaHashedKeyGenParams;
  }
  return { name: "ECDSA", namedCurve: CURVE_MAP[alg] } as EcKeyGenParams;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function toPem(base64: string, label: string): string {
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

export interface JwtKeyPairResult {
  algorithm: JwtAlgorithm;
  publicKeyPem: string;
  privateKeyPem: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export async function generateJwtKeyPair(alg: JwtAlgorithm, rsaModulusLength = 2048): Promise<JwtKeyPairResult> {
  const keyGenParams = getKeyGenParams(alg, rsaModulusLength);
  const keyPair = (await crypto.subtle.generateKey(keyGenParams, true, ["sign", "verify"])) as CryptoKeyPair;

  const [spki, pkcs8, publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("jwk", keyPair.publicKey),
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
  ]);

  return {
    algorithm: alg,
    publicKeyPem: toPem(arrayBufferToBase64(spki), "PUBLIC KEY"),
    privateKeyPem: toPem(arrayBufferToBase64(pkcs8), "PRIVATE KEY"),
    publicKeyJwk: { ...publicKeyJwk, alg, use: "sig" } as JsonWebKey,
    privateKeyJwk: { ...privateKeyJwk, alg, use: "sig" } as JsonWebKey,
  };
}
