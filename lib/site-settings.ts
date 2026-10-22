import { kv, safe } from "@/lib/kv";

// Settings the admin can change instantly (no redeploy). Environment variables are the defaults,
// so the site behaves exactly as before when nothing has been changed in /admin or storage is down.

export interface SiteSettings {
  aiEnabled: boolean;
  aiDailyCap: number;
  commentsPaused: boolean;
  autoApprove: boolean;
  blocklist: string[];
}

const KEY = "tn:settings";

export function envDefaults(): SiteSettings {
  return {
    aiEnabled: process.env.AI_ASSIST_ENABLED !== "false",
    aiDailyCap: Number(process.env.AI_DAILY_CAP ?? 500) || 500,
    commentsPaused: false,
    autoApprove: false,
    blocklist: [],
  };
}

export async function getSettings(): Promise<SiteSettings> {
  const d = envDefaults();
  const raw = await safe(() => kv().hgetall(KEY), null);
  if (!raw) return d;
  let blocklist = d.blocklist;
  try {
    if (raw.blocklist) blocklist = JSON.parse(raw.blocklist);
  } catch {}
  return {
    aiEnabled: raw.aiEnabled !== undefined ? raw.aiEnabled === "1" : d.aiEnabled,
    aiDailyCap: raw.aiDailyCap !== undefined ? Number(raw.aiDailyCap) || d.aiDailyCap : d.aiDailyCap,
    commentsPaused: raw.commentsPaused === "1",
    autoApprove: raw.autoApprove === "1",
    blocklist,
  };
}

export async function saveSettings(patch: Partial<SiteSettings>) {
  const out: Record<string, string> = {};
  if (patch.aiEnabled !== undefined) out.aiEnabled = patch.aiEnabled ? "1" : "0";
  if (patch.aiDailyCap !== undefined) out.aiDailyCap = String(Math.max(0, Math.round(patch.aiDailyCap)));
  if (patch.commentsPaused !== undefined) out.commentsPaused = patch.commentsPaused ? "1" : "0";
  if (patch.autoApprove !== undefined) out.autoApprove = patch.autoApprove ? "1" : "0";
  if (patch.blocklist !== undefined) out.blocklist = JSON.stringify(patch.blocklist.slice(0, 200));
  if (Object.keys(out).length) await kv().hset(KEY, out);
}
