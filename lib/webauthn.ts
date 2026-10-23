export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildCreateOptions(rpName: string, userName: string): PublicKeyCredentialCreationOptions {
  return {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: rpName, id: window.location.hostname },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: userName,
      displayName: userName,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    timeout: 60000,
    attestation: "none",
  };
}

export function buildGetOptions(allowCredentialIds: string[] = []): PublicKeyCredentialRequestOptions {
  return {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rpId: window.location.hostname,
    allowCredentials: allowCredentialIds.map((id) => ({
      type: "public-key" as const,
      id: base64UrlToBuffer(id),
    })),
    userVerification: "preferred",
    timeout: 60000,
  };
}

function base64UrlToBuffer(s: string): ArrayBuffer {
  const clean = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export interface AuthenticatorDataSummary {
  rpIdHashHex: string;
  flags: { userPresent: boolean; userVerified: boolean; backupEligible: boolean; backupState: boolean; attestedCredentialIncluded: boolean; extensionDataIncluded: boolean };
  signCount: number;
  aaguid?: string;
  credentialId?: string;
}

/** Parses the fixed-layout prefix of authenticatorData (RFC / WebAuthn L3 §6.1) — rpIdHash(32),
 * flags(1), signCount(4), and, when the AT flag is set, the attested credential data header. */
export function parseAuthenticatorData(buf: ArrayBuffer): AuthenticatorDataSummary {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  const rpIdHash = bytes.slice(0, 32);
  const flagsByte = bytes[32];
  const signCount = view.getUint32(33, false);

  const flags = {
    userPresent: !!(flagsByte & 0x01),
    userVerified: !!(flagsByte & 0x04),
    backupEligible: !!(flagsByte & 0x08),
    backupState: !!(flagsByte & 0x10),
    attestedCredentialIncluded: !!(flagsByte & 0x40),
    extensionDataIncluded: !!(flagsByte & 0x80),
  };

  const summary: AuthenticatorDataSummary = { rpIdHashHex: bufToHex(rpIdHash), flags, signCount };

  if (flags.attestedCredentialIncluded && bytes.length >= 37 + 16 + 2) {
    const aaguid = bytes.slice(37, 53);
    const credIdLen = view.getUint16(53, false);
    const credId = bytes.slice(55, 55 + credIdLen);
    summary.aaguid = [
      bufToHex(aaguid.slice(0, 4)),
      bufToHex(aaguid.slice(4, 6)),
      bufToHex(aaguid.slice(6, 8)),
      bufToHex(aaguid.slice(8, 10)),
      bufToHex(aaguid.slice(10, 16)),
    ].join("-");
    summary.credentialId = bufToBase64Url(credId.buffer as ArrayBuffer);
  }

  return summary;
}

export interface CreateCredentialSummary {
  id: string;
  type: string;
  authenticatorAttachment: string | null;
  clientDataJson: unknown;
  authenticatorData: AuthenticatorDataSummary;
  transports: string[];
}

export function summarizeCreatedCredential(cred: PublicKeyCredential): CreateCredentialSummary {
  const response = cred.response as AuthenticatorAttestationResponse;
  const clientDataJson = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
  const authData = response.getAuthenticatorData ? response.getAuthenticatorData() : new ArrayBuffer(0);

  return {
    id: cred.id,
    type: cred.type,
    authenticatorAttachment: cred.authenticatorAttachment ?? null,
    clientDataJson,
    authenticatorData: parseAuthenticatorData(authData),
    transports: response.getTransports ? response.getTransports() : [],
  };
}

export interface GetCredentialSummary {
  id: string;
  type: string;
  clientDataJson: unknown;
  authenticatorData: AuthenticatorDataSummary;
  userHandle: string | null;
}

export function summarizeAssertion(cred: PublicKeyCredential): GetCredentialSummary {
  const response = cred.response as AuthenticatorAssertionResponse;
  const clientDataJson = JSON.parse(new TextDecoder().decode(response.clientDataJSON));

  return {
    id: cred.id,
    type: cred.type,
    clientDataJson,
    authenticatorData: parseAuthenticatorData(response.authenticatorData),
    userHandle: response.userHandle ? bufToBase64Url(response.userHandle) : null,
  };
}
