import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getSettings } from "@/lib/site-settings";
import { kv } from "@/lib/kv";
import { MIN_RATINGS_FOR_STARS, MAX_COMMENT } from "@/lib/reviews";
import { twoFactorEnabled, backupCodesLeft, resetOverride } from "@/lib/two-factor";
import { tgConfigured, getChatId, getBotUsername } from "@/lib/telegram";
import { Button, Card } from "@/components/admin/ui";
import TwoFactorPanel from "@/components/admin/TwoFactorPanel";
import TelegramPanel from "@/components/admin/TelegramPanel";
import { OwnerModeToggle } from "@/components/admin/OwnerMode";
import { saveModeration, signOutEverywhere } from "../../actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const [s, tfa, backups, chat, username] = await Promise.all([
    getSettings(),
    twoFactorEnabled(),
    backupCodesLeft(),
    getChatId(),
    tgConfigured() ? getBotUsername() : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Two-step sign-in">
        <TwoFactorPanel enabled={tfa} backupsLeft={backups} resetOverride={resetOverride()} />
      </Card>

      <Card title="Telegram alerts">
        <p className="text-xs text-[#777777] mb-4">
          New reviews and bug reports (with Approve / Reject buttons), spam spikes, AI budget warnings, sign-ins and lockouts. Commands: /status, /ninja on|off,
          /pause, /resume.
        </p>
        <TelegramPanel configured={tgConfigured()} linked={Boolean(chat)} username={username} />
      </Card>

      <Card title="Owner mode">
        <OwnerModeToggle />
      </Card>

      <Card title="Sessions">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#888888] max-w-lg">Signs out every browser that&apos;s signed in to admin, including this one. Use it if you signed in on a device you don&apos;t control.</p>
          <form action={signOutEverywhere}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#f87171] bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20">
              <LogOut size={12} /> Sign out everywhere
            </button>
          </form>
        </div>
      </Card>

      <Card title="Comments & moderation">
        <form action={saveModeration} className="space-y-5">
          <label className="flex items-start gap-3 text-sm text-[#dddddd]">
            <input type="checkbox" name="commentsPaused" defaultChecked={s.commentsPaused} className="mt-0.5 accent-[#a855f7] w-4 h-4" />
            <span>
              Pause new comments
              <span className="block text-xs text-[#777777]">Star ratings keep working. Turns on automatically during a spam spike.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[#dddddd]">
            <input type="checkbox" name="autoApprove" defaultChecked={s.autoApprove} className="mt-0.5 accent-[#a855f7] w-4 h-4" />
            <span>
              Auto-approve comments the AI marks as genuine
              <span className="block text-xs text-[#777777]">Comments with a removed secret or a mentioned domain always wait for you.</span>
            </span>
          </label>
          <label className="block text-sm text-[#dddddd]">
            Extra blocked words
            <span className="block text-xs text-[#777777] mb-1.5">One per line. Comments containing them are silently dropped. A built-in list (casino, backlinks, …) always applies.</span>
            <textarea
              name="blocklist"
              rows={4}
              defaultValue={s.blocklist.join("\n")}
              className="w-full px-3 py-2 text-sm font-mono bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5]"
            />
          </label>
          <Button tone="primary">Save</Button>
        </form>
      </Card>

      <Card title="How reviews work">
        <ul className="space-y-1.5 text-xs text-[#999999] list-disc pl-4">
          <li>Average stars show on a tool page (and in Google results) once it has {MIN_RATINGS_FOR_STARS}+ ratings.</li>
          <li>Comments: max {MAX_COMMENT} characters, no links. One rating per tool per visitor per day.</li>
          <li>Spam layers: page token, hidden trap field, time on page, origin check, rate limits, content rules, AI moderation, your approval.</li>
          <li>Visitor IPs are never stored — only a daily-rotating anonymous hash.</li>
          <li>Storage: {kv().persistent ? "Upstash Redis (connected)" : "in-memory fallback — connect Upstash to keep data"}.</li>
        </ul>
      </Card>
    </div>
  );
}
