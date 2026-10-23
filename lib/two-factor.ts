import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import QRCode from "qrcode";
import { kv, safe } from "@/lib/kv";
import { base32Decode, buildOtpauthUrl, generateRandomSecret, hotp } from "@/lib/totp";

// Authenticator-app (TOTP, RFC 6238) second step for /admin, plus one-time backup codes.
// The TOTP secret is stored AES-256-GCM-encrypted with a key derived from ADMIN_SESSION_SECRET,
// so a copy of the Redis data alone can't produce codes. Backup codes are stored as SHA-256 hashes.
// Emergency escape hatch: ADMIN_2FA_RESET=true in the environment skips the code step.

const K = {
  secret: "tn:admin:2fa",
  pending: "tn:admin:2fa:pending",
  backup: "tn:admin:2fa:backup",
  lastCounter: "tn:admin:2fa:last",
  sessionVer: "tn:admin:sessver",
};
const PERIOD = 30;
const BACKUP_COUNT = 10;

function key(): Buffer {
  return createHash("sha256").update(`${process.env.ADMIN_SESSION_SECRET ?? ""}|admin-2fa`).digest();
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decrypt(blob: string): string | null {
  try {
    const [iv, tag, data] = blob.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

const hashCode = (code: string) => createHash("sha256").update(`backup|${code.toLowerCase().replace(/[^a-z0-9]/g, "")}`).digest("hex");

export const resetOverride = () => process.env.ADMIN_2FA_RESET === "true";

export async function twoFactorEnabled(): Promise<boolean> {
  return Boolean(await safe(() => kv().get(K.secret), null));
}

/** Whether sign-in must ask for a code. Throws when storage can't be read — sign-in must not fall back to password-only. */
export async function codeRequiredStrict(): Promise<boolean> {
  if (resetOverride()) return false;
  return Boolean(await kv().get(K.secret));
}

export async function backupCodesLeft(): Promise<number> {
  const raw = await safe(() => kv().get(K.backup), null);
  try {
    return raw ? (JSON.parse(raw) as string[]).length : 0;
  } catch {
    return 0;
  }
}

/** Step 1 of setup: a fresh secret, held for 10 minutes until confirmed with a code. */
export async function startSetup(): Promise<{ secret: string; qrSvg: string }> {
  const secret = generateRandomSecret(20);
  await kv().set(K.pending, encrypt(secret), { ex: 600 });
  const url = buildOtpauthUrl(secret, "admin", "ToolNinja");
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0a0a0a", light: "#ffffff" } });
  return { secret, qrSvg };
}

async function matchTotp(secret: string, code: string): Promise<number | null> {
  if (!/^\d{6}$/.test(code)) return null;
  const keyBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000 / PERIOD);
  // one step either side tolerates small clock drift
  for (const counter of [now, now - 1, now + 1]) if ((await hotp(keyBytes, counter, 6, "SHA-1")) === code) return counter;
  return null;
}

function newBackupCodes(): string[] {
  return Array.from({ length: BACKUP_COUNT }, () => {
    const h = randomBytes(5).toString("hex");
    return `${h.slice(0, 5)}-${h.slice(5)}`;
  });
}

/** Step 2 of setup: confirms the app works, enables 2FA, returns backup codes (shown once). */
export async function confirmSetup(code: string): Promise<string[] | null> {
  const pending = await kv().get(K.pending);
  const secret = pending ? decrypt(pending) : null;
  if (!secret) return null;
  const counter = await matchTotp(secret, code.trim());
  if (counter === null) return null;
  const codes = newBackupCodes();
  await kv()
    .batch()
    .set(K.secret, encrypt(secret))
    .set(K.backup, JSON.stringify(codes.map(hashCode)))
    .set(K.lastCounter, String(counter))
    .del(K.pending)
    .exec();
  return codes;
}

/** Verifies a sign-in code: a 6-digit TOTP (each code usable once) or an unused backup code. */
export async function verifyCode(input: string): Promise<"totp" | "backup" | null> {
  const code = input.trim();
  const stored = await kv().get(K.secret);
  const secret = stored ? decrypt(stored) : null;
  if (!secret) return null;

  const counter = await matchTotp(secret, code.replace(/\s/g, ""));
  if (counter !== null) {
    const last = Number((await kv().get(K.lastCounter)) ?? -1);
    if (counter <= last) return null; // replay of an already-used code
    await kv().set(K.lastCounter, String(counter));
    return "totp";
  }

  const raw = await kv().get(K.backup);
  const hashes: string[] = raw ? JSON.parse(raw) : [];
  const h = hashCode(code);
  if (hashes.includes(h)) {
    await kv().set(K.backup, JSON.stringify(hashes.filter((x) => x !== h)));
    return "backup";
  }
  return null;
}

export async function regenerateBackupCodes(): Promise<string[]> {
  const codes = newBackupCodes();
  await kv().set(K.backup, JSON.stringify(codes.map(hashCode)));
  return codes;
}

export async function disableTwoFactor() {
  await kv().batch().del(K.secret).del(K.backup).del(K.lastCounter).del(K.pending).exec();
}

// ─── Session generation ("sign out everywhere") ─────────────────────────────

export async function sessionVersion(): Promise<number> {
  return Number(await safe(() => kv().get(K.sessionVer), "1")) || 1;
}

export async function bumpSessionVersion(): Promise<number> {
  return kv().incr(K.sessionVer).then((n) => (n < 2 ? kv().incr(K.sessionVer) : n));
}
