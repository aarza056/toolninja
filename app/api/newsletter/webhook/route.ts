import { verifySvix } from "@/lib/svix";
import { markUndeliverable } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resend calls this for delivery events (RESEND_WEBHOOK_SECRET, from the webhook's page in Resend).
// Permanent bounces and spam complaints take the address off the list for good.

interface ResendEvent {
  type?: string;
  data?: { to?: string[]; bounce?: { type?: string } };
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("not configured", { status: 503 });
  const body = await req.text();
  const valid = verifySvix(secret, { id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature") }, body);
  if (!valid) return new Response("invalid signature", { status: 401 });

  let event: ResendEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const recipients = event.data?.to ?? [];
  if (event.type === "email.bounced" && event.data?.bounce?.type === "Permanent") {
    for (const to of recipients) await markUndeliverable(to, "bounced");
  } else if (event.type === "email.complained") {
    for (const to of recipients) await markUndeliverable(to, "complained");
  }
  return Response.json({ ok: true });
}
