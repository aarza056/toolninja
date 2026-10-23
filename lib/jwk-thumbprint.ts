export type ThumbprintHash = "SHA-256" | "SHA-384" | "SHA-512";

// RFC 7638 defines exactly which JWK members participate in the thumbprint hash, per key type —
// and the order those members must appear in the canonical JSON (lexicographic by member name).
const REQUIRED_MEMBERS: Record<string, string[]> = {
  RSA: ["e", "kty", "n"],
  EC: ["crv", "kty", "x", "y"],
  oct: ["k", "kty"],
  OKP: ["crv", "kty", "x"], // RFC 8037 (Ed25519 / X25519)
};

export function canonicalJwkJson(jwk: JsonWebKey): string {
  const kty = jwk.kty;
  if (!kty) throw new Error('JWK is missing the required "kty" field.');

  const members = REQUIRED_MEMBERS[kty];
  if (!members) {
    throw new Error(`Unsupported key type "${kty}". RFC 7638 thumbprints are defined for RSA, EC, oct, and OKP keys.`);
  }

  const obj: Record<string, string> = {};
  for (const key of members) {
    const value = (jwk as unknown as Record<string, unknown>)[key];
    if (typeof value !== "string") {
      throw new Error(`JWK is missing the required "${key}" field for a ${kty} key thumbprint.`);
    }
    obj[key] = value;
  }

  // Manual construction (not JSON.stringify on a pre-sorted object) guarantees member order,
  // since JSON.stringify's key order for string keys is insertion order — which this already is,
  // but being explicit here avoids ever depending on that implementation detail silently.
  return "{" + members.map((k) => `"${k}":${JSON.stringify(obj[k])}`).join(",") + "}";
}

function base64UrlFromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function computeJwkThumbprint(jwk: JsonWebKey, hash: ThumbprintHash = "SHA-256"): Promise<{ canonical: string; thumbprint: string; hex: string }> {
  const canonical = canonicalJwkJson(jwk);
  const digest = await crypto.subtle.digest(hash, new TextEncoder().encode(canonical));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { canonical, thumbprint: base64UrlFromBuffer(digest), hex };
}
