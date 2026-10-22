import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";

/** Server-side check for admin pages and server actions (middleware is only the outer gate). */
export async function requireAdmin() {
  if (!(await verifySession(cookies().get(ADMIN_COOKIE)?.value))) redirect("/admin/login");
}
