// Email templates for the newsletter and the double opt-in confirmation. Table layout with inline
// styles and no images — the combination that renders the same in Gmail, Outlook and Apple Mail.
// Every email has a plain-text part too.

export interface DigestItem {
  kind: "new" | "improved" | "guide" | "video";
  title: string;
  text: string;
  url: string;
}

export interface NewsletterContent {
  subject: string;
  /** Short text shown in the inbox list next to the subject */
  preheader: string;
  intro: string;
  items: DigestItem[];
}

export interface Links {
  siteUrl: string;
  unsubscribeUrl: string;
  /** Required by CAN-SPAM for commercial email to US recipients; shown in the footer when set */
  postalAddress?: string;
}

const PURPLE = "#7c3aed";
const INK = "#18181b";
const MUTED = "#52525b";
const LINE = "#e4e4e7";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Plain text with blank-line paragraphs → <p>s; nothing else is interpreted. */
function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:24px;color:${INK}">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function shell(preheader: string, body: string, footer: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>ToolNinja</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f4f5">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;font-family:${FONT}">
<tr><td style="background:${PURPLE};padding:20px 28px">
<a href="https://toolninja.io" style="color:#ffffff;text-decoration:none;font-size:20px;font-weight:700;font-family:${FONT}">🥷 ToolNinja</a>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid ${LINE};font-size:12px;line-height:18px;color:${MUTED};font-family:${FONT}">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const SECTION: Record<DigestItem["kind"], string> = { new: "🆕 New tools", improved: "⚡ Improved", guide: "📖 New guide", video: "🎬 New videos" };

export function renderNewsletter(c: NewsletterContent, links: Links): { html: string; text: string } {
  const sections = (["new", "improved", "guide", "video"] as const)
    .map((kind) => {
      const items = c.items.filter((i) => i.kind === kind);
      if (!items.length) return "";
      const rows = items
        .map(
          (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${LINE}">
<a href="${escapeHtml(i.url)}" style="color:${PURPLE};font-size:16px;font-weight:600;text-decoration:none">${escapeHtml(i.title)}</a>
<div style="margin-top:3px;font-size:14px;line-height:20px;color:${MUTED}">${escapeHtml(i.text)}</div>
</td></tr>`
        )
        .join("");
      return `<h2 style="margin:24px 0 4px;font-size:15px;color:${INK};font-family:${FONT}">${SECTION[kind]}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
    })
    .join("");

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px"><tr><td style="background:${PURPLE};border-radius:8px">
<a href="${escapeHtml(links.siteUrl)}/changelog" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:${FONT}">See everything that's new →</a>
</td></tr></table>`;

  const footer = `You're receiving this because you subscribed at toolninja.io. Every tool is free, needs no account and runs in your browser.<br>
<a href="${escapeHtml(links.unsubscribeUrl)}" style="color:${MUTED}">Unsubscribe</a> · <a href="${escapeHtml(links.siteUrl)}/privacy" style="color:${MUTED}">Privacy</a>${links.postalAddress ? `<br>${escapeHtml(links.postalAddress)}` : ""}`;

  const html = shell(c.preheader, `${paragraphs(c.intro)}${sections}${button}`, footer);

  const textSections = (["new", "improved", "guide", "video"] as const)
    .map((kind) => {
      const items = c.items.filter((i) => i.kind === kind);
      return items.length ? `${SECTION[kind].replace(/^\S+\s/, "").toUpperCase()}\n\n${items.map((i) => `* ${i.title}\n  ${i.text}\n  ${i.url}`).join("\n\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  const text = `${c.intro.trim()}\n\n${textSections}\n\nEverything that's new: ${links.siteUrl}/changelog\n\n--\nYou're receiving this because you subscribed at toolninja.io.\nUnsubscribe: ${links.unsubscribeUrl}${links.postalAddress ? `\n${links.postalAddress}` : ""}\n`;
  return { html, text };
}

export function renderConfirmEmail(confirmUrl: string): { subject: string; html: string; text: string } {
  const subject = "Confirm your ToolNinja subscription";
  const body = `<p style="margin:0 0 14px;font-size:16px;line-height:24px;color:${INK}">Thanks for signing up! Click below to confirm, and you'll get an email when new tools ship — about once a month, never more than that.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0"><tr><td style="background:${PURPLE};border-radius:8px">
<a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:${FONT}">Confirm subscription</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:20px;color:${MUTED}">Didn't sign up? Ignore this email — without a click you won't hear from us again.</p>`;
  const footer = `This link works for 7 days. ToolNinja · free developer tools that run in your browser.`;
  return {
    subject,
    html: shell("One click to start getting new tools.", body, footer),
    text: `Thanks for signing up for ToolNinja updates!\n\nConfirm your subscription (link works for 7 days):\n${confirmUrl}\n\nDidn't sign up? Ignore this email — without a click you won't hear from us again.\n`,
  };
}
