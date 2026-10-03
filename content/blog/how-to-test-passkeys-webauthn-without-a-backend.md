---
title: "How to Test Passkeys (WebAuthn) Without Building a Backend First"
description: "A practical, step-by-step guide to running real WebAuthn registration and authentication ceremonies in your browser — no relying-party server required — plus what the flags in the response actually mean."
date: "2026-10-03"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["passkey tutorial", "webauthn tutorial", "how to test passkeys", "webauthn without server", "navigator.credentials.create", "passkey vs security key", "webauthn authenticatorData flags", "passkeys", "security", "authentication"]
relatedTools: ["passkey-tester", "jwk-thumbprint-calculator", "totp-generator"]
faqs:
  - q: "Do I need HTTPS to test WebAuthn?"
    a: "Yes — WebAuthn only runs in a secure context, which means HTTPS, or localhost specifically (localhost is special-cased as secure even over plain HTTP for local development). Any other plain-HTTP origin will have navigator.credentials silently unavailable or throw immediately."
  - q: "What's the difference between a passkey and a traditional WebAuthn security key?"
    a: "Both use the same underlying WebAuthn protocol and produce the same kind of response. A hardware security key (like a YubiKey) is device-bound — its private key never leaves that physical device. A passkey is typically synced — the private key is backed up, usually encrypted, to a password manager or OS keychain (iCloud Keychain, Google Password Manager, Windows Hello) and available across your devices. The credential response's 'backup eligible' flag tells you which kind you're looking at."
  - q: "Why does sign count stay at 0 for my passkey but increment for my hardware key?"
    a: "Sign count exists specifically to help a relying-party server detect a cloned hardware authenticator — if a cloned key's counter is ever lower than the last value the server saw, that's a red flag. A synced passkey can legitimately be used from multiple devices in parallel, which would make counter tracking produce false positives, so platform authenticators and synced passkeys commonly report a counter of 0 and rely on other signals instead."
  - q: "Can I verify a passkey signature without a backend?"
    a: "Not meaningfully for a real security flow — verification requires storing the public key from registration and checking it against every subsequent authentication, which is inherently a server-side responsibility (or at minimum, a trusted verifier holding that stored public key). A browser-only sandbox is for learning the ceremony and inspecting the response shape, not for standing in for that verification step."
---

## Why This Is Harder to Learn Than It Should Be

Every WebAuthn tutorial assumes you already have a relying-party server: an endpoint to generate a challenge, an endpoint to verify the response, a database table for credentials. That's the right architecture for production — but it means you can't see what a passkey ceremony actually *produces* without first writing backend code you don't have yet.

You don't need any of that to understand the mechanism. `navigator.credentials.create()` and `navigator.credentials.get()` are browser APIs. They talk directly to your device's authenticator — Touch ID, Windows Hello, a hardware key, or a synced passkey on your phone — and hand back a response object you can inspect immediately, with nothing on a server involved yet.

This walks through doing exactly that.

---

## Step 1: Confirm You're in a Secure Context

WebAuthn refuses to run anywhere except a secure context — HTTPS, or `localhost` specifically (which browsers treat as secure for local development even over plain HTTP).

```javascript
const supported = typeof window !== "undefined"
  && !!window.PublicKeyCredential
  && !!navigator.credentials;

const secureContext = window.isSecureContext;
```

If either check fails, every call below will throw or silently do nothing. This is the single most common reason a WebAuthn demo "doesn't work" during local development — a dev server running on plain `http://192.168.x.x` instead of `localhost` or HTTPS.

---

## Step 2: Register a Credential (`create()`)

Registration needs a few required fields: a random challenge, a relying-party ID (your domain, or `localhost`), and a user identifier.

```javascript
const options = {
  challenge: crypto.getRandomValues(new Uint8Array(32)),
  rp: { name: "My App", id: window.location.hostname },
  user: {
    id: crypto.getRandomValues(new Uint8Array(16)),
    name: "test@example.com",
    displayName: "test@example.com",
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 },   // ES256
    { type: "public-key", alg: -257 }, // RS256
  ],
  authenticatorSelection: {
    residentKey: "preferred",
    userVerification: "preferred",
  },
  timeout: 60000,
  attestation: "none",
};

const credential = await navigator.credentials.create({ publicKey: options });
```

In a real flow, the challenge comes from your server (and your server remembers it, to check against later). Here, generating it client-side is fine — you're not verifying anything yet, just observing the shape of the ceremony.

This call is what triggers the OS-level prompt: Touch ID, a Windows Hello PIN, or a tap on a hardware key.

---

## Step 3: Decode What Came Back

The `credential` object isn't very readable as-is — the interesting data is packed into `credential.response`, specifically inside `authenticatorData`, which has a fixed binary layout worth knowing:

| Bytes | Field |
|---|---|
| 0–31 | SHA-256 hash of the RP ID |
| 32 | Flags byte |
| 33–36 | Sign count (big-endian uint32) |
| 37+ | Attested credential data (AAGUID, credential ID, public key) — only present on registration |

The flags byte is the part worth decoding by hand once, so you know what each bit means for good:

```javascript
function parseFlags(flagsByte) {
  return {
    userPresent:       !!(flagsByte & 0x01), // UP
    userVerified:      !!(flagsByte & 0x04), // UV
    backupEligible:    !!(flagsByte & 0x08), // BE
    backupState:       !!(flagsByte & 0x10), // BS
    attestedCredData:  !!(flagsByte & 0x40), // AT
    extensionData:     !!(flagsByte & 0x80), // ED
  };
}
```

**Backup eligible** is the flag that actually tells you whether you're holding a passkey (synced, eligible for backup) or a device-bound credential (a hardware key — never eligible). This is the cleanest way to answer "is this really a passkey?" from code, rather than guessing from the authenticator's name.

---

## Step 4: Authenticate With It (`get()`)

Once a credential exists, authentication is a second, separate ceremony:

```javascript
const getOptions = {
  challenge: crypto.getRandomValues(new Uint8Array(32)),
  rpId: window.location.hostname,
  allowCredentials: [{ type: "public-key", id: credential.rawId }],
  userVerification: "preferred",
  timeout: 60000,
};

const assertion = await navigator.credentials.get({ publicKey: getOptions });
```

The response here has the same `authenticatorData` structure (minus the attested credential data block, since that only appears during registration), plus a `signature` — the thing a real server would verify against the public key it stored back in step 2.

---

## The One Thing a Backend-Free Sandbox *Can't* Show You

Everything above happens entirely client-side, which is exactly what makes it useful for learning the mechanism — and exactly why it can't replace real verification. Verifying `assertion.signature` requires the public key from registration, which only a server (or some other party you trust to hold it) has any business storing. A page with no backend has nothing to check the signature against.

Treat a sandbox like this as step zero: understand the request/response shape, confirm your authenticator and browser combination actually supports the flow, then move to a real library (`@simplewebauthn/server`, `webauthn4j`, `fido2-lib`, or similar) for the server side, which handles challenge storage, signature verification, and counter tracking correctly.

---

## Try It Live

**[ToolNinja's Passkey / WebAuthn Playground →](/tools/passkey-tester)** runs exactly the flow above — create a real passkey, authenticate with it, and see every flag, the AAGUID, sign count, and transports decoded in place. No account, no backend, nothing transmitted anywhere.

---

Sources:
- [WebAuthn API — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Web Authentication: An API for accessing Public Key Credentials — W3C Recommendation](https://www.w3.org/TR/webauthn-3/)
