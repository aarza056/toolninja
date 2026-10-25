// Sending through Resend (RESEND_API_KEY). Server-only.
//
// NEWSLETTER_FROM sets the sender, e.g. "ToolNinja <news@mail.toolninja.io>" once that domain is
// verified in Resend. Until then Resend only delivers from onboarding@resend.dev to the account
// owner's own address — fine for test sends.

const API_BASE = process.env.RESEND_API_BASE || "https://api.resend.com"; // overridable for tests

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
export const fromAddress = () => process.env.NEWSLETTER_FROM || "ToolNinja <news@mail.toolninja.io>";
export const replyTo = () => process.env.NEWSLETTER_REPLY_TO || "info@toolninja.io";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function payload(e: OutgoingEmail) {
  return { from: fromAddress(), to: [e.to], reply_to: replyTo(), subject: e.subject, html: e.html, text: e.text, ...(e.headers ? { headers: e.headers } : {}) };
}

async function call(path: string, body: unknown, idempotencyKey?: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}

async function errorText(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string; name?: string } | null;
  return body?.message || body?.name || `Resend returned ${res.status}`;
}

export async function sendEmail(e: OutgoingEmail): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const res = await call("/emails", payload(e));
    if (!res.ok) return { ok: false, error: await errorText(res) };
    const body = (await res.json()) as { id?: string };
    return { ok: true, id: body.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "request failed" };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends many emails, 100 per request (Resend's batch limit) and well under its 10 requests/second.
 * Each email keeps its own headers, so every recipient gets their own unsubscribe link.
 */
export async function sendBatch(emails: OutgoingEmail[], idempotencyPrefix: string): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!emailConfigured()) return { sent: 0, failed: emails.length, errors: ["RESEND_API_KEY is not set"] };
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    let attempt = 0;
    for (;;) {
      try {
        const res = await call("/emails/batch", chunk.map(payload), `${idempotencyPrefix}-${i / 100}`);
        if (res.status === 429 && attempt < 3) {
          attempt++;
          await sleep(1000 * attempt);
          continue;
        }
        if (res.ok) sent += chunk.length;
        else {
          failed += chunk.length;
          errors.push(await errorText(res));
        }
      } catch (err) {
        failed += chunk.length;
        errors.push(err instanceof Error ? err.message : "request failed");
      }
      break;
    }
    if (i + 100 < emails.length) await sleep(250);
  }
  return { sent, failed, errors: Array.from(new Set(errors)) };
}
