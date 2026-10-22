"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { saveSettings } from "@/lib/site-settings";
import { clearSpikeAlert, listReviews, resolveHeld, setReviewStatus, isTool, type ReviewStatus } from "@/lib/reviews";

const refresh = () => revalidatePath("/admin", "layout");

export async function saveNinjaSettings(form: FormData) {
  await requireAdmin();
  const cap = Number(form.get("aiDailyCap"));
  await saveSettings({
    aiEnabled: form.get("aiEnabled") === "on",
    ...(Number.isFinite(cap) && cap >= 0 ? { aiDailyCap: Math.min(cap, 100000) } : {}),
  });
  refresh();
}

export async function toggleNinja(form: FormData) {
  await requireAdmin();
  await saveSettings({ aiEnabled: form.get("to") === "on" });
  refresh();
}

const STATUSES: (ReviewStatus | "deleted")[] = ["pending", "bug", "published", "rejected", "deleted"];

export async function reviewAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const to = String(form.get("to") ?? "") as ReviewStatus | "deleted";
  if (/^[0-9a-f]{16}$/.test(id) && STATUSES.includes(to)) await setReviewStatus(id, to);
  refresh();
}

export async function approveAllGenuine() {
  await requireAdmin();
  const pending = await listReviews("pending", 500);
  for (const r of pending) if (r.category === "genuine" && !r.redacted && !r.note.includes("mentions a domain")) await setReviewStatus(r.id, "published");
  refresh();
}

export async function heldAction(form: FormData) {
  await requireAdmin();
  const slug = String(form.get("slug") ?? "");
  if (isTool(slug)) await resolveHeld(slug, form.get("to") === "accept");
  refresh();
}

export async function saveModeration(form: FormData) {
  await requireAdmin();
  const blocklist = String(form.get("blocklist") ?? "")
    .split(/[\n,]/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2)
    .slice(0, 200);
  await saveSettings({
    commentsPaused: form.get("commentsPaused") === "on",
    autoApprove: form.get("autoApprove") === "on",
    blocklist,
  });
  if (form.get("commentsPaused") !== "on") await clearSpikeAlert();
  refresh();
}

export async function dismissSpikeAlert() {
  await requireAdmin();
  await clearSpikeAlert();
  refresh();
}
