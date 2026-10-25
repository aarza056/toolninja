"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-guard";
import { buildEmail, sendTest, sendToAll, deleteSubscriber, listSubscribers, toCsv, siteUrlFor } from "@/lib/newsletter";

export interface DraftInput {
  subject: string;
  preheader: string;
  intro: string;
  releaseDate: string;
}

const clean = (d: DraftInput): DraftInput => ({
  subject: String(d.subject ?? "").trim().slice(0, 150),
  preheader: String(d.preheader ?? "").trim().slice(0, 200),
  intro: String(d.intro ?? "").slice(0, 4000),
  releaseDate: String(d.releaseDate ?? ""),
});

const site = () => siteUrlFor(headers().get("origin"));

export async function previewNewsletter(d: DraftInput): Promise<{ html: string; text: string }> {
  await requireAdmin();
  const x = clean(d);
  return buildEmail({ subject: x.subject, preheader: x.preheader, intro: x.intro }, x.releaseDate, `${site()}/newsletter/unsubscribe?t=TEST`, site());
}

export async function sendNewsletterTest(d: DraftInput, to: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const x = clean(d);
  if (!x.subject) return { ok: false, error: "Add a subject first." };
  const r = await sendTest({ subject: x.subject, preheader: x.preheader, intro: x.intro }, x.releaseDate, to, site());
  revalidatePath("/admin/newsletter");
  return r;
}

export async function sendNewsletterToAll(d: DraftInput, expectedRecipients: number): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> {
  await requireAdmin();
  const x = clean(d);
  if (!x.subject || !x.intro.trim()) return { ok: false, sent: 0, failed: 0, error: "Add a subject and an intro first." };
  const r = await sendToAll({ subject: x.subject, preheader: x.preheader, intro: x.intro }, x.releaseDate, expectedRecipients, site());
  revalidatePath("/admin/newsletter");
  return r;
}

export async function removeSubscriber(form: FormData) {
  await requireAdmin();
  await deleteSubscriber(String(form.get("email") ?? ""));
  revalidatePath("/admin/newsletter");
}

export async function exportSubscribers(): Promise<string> {
  await requireAdmin();
  return toCsv(await listSubscribers());
}
