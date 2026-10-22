import { createHash, createHmac } from "crypto";
import { today } from "@/lib/kv";

// An anonymous visitor id for rate limits and duplicate-vote checks. IPs are never stored: they're
// hashed with a salt that changes every day, so ids can't be traced back or linked across days.

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function visitorId(req: Request): string {
  const salt = createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "toolninja-dev-salt")
    .update(`visitor|${today()}`)
    .digest("hex");
  return createHash("sha256")
    .update(`${salt}|${clientIp(req)}|${req.headers.get("user-agent") ?? ""}`)
    .digest("hex")
    .slice(0, 24);
}

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?toolninja\.io$/, /^https:\/\/[\w-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];

/** Requests from browsers carry an Origin; reject ones from other sites. */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  return !origin || ALLOWED_ORIGINS.some((re) => re.test(origin));
}
