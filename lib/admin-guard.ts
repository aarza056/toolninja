import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";
import { sessionVersion } from "@/lib/two-factor";

/**
 * Server-side check for admin pages and server actions (middleware is only the outer gate).
 * Also rejects sessions from before the last "sign out everywhere".
 */
export async function requireAdmin() {
  const ver = await verifySession(cookies().get(ADMIN_COOKIE)?.value);
  if (ver === null || ver !== (await sessionVersion())) redirect("/admin/login");
}
