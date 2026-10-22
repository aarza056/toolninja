import type { Metadata } from "next";
import { getSettings } from "@/lib/site-settings";
import { kv } from "@/lib/kv";
import { MIN_RATINGS_FOR_STARS, MAX_COMMENT } from "@/lib/reviews";
import { Button, Card } from "@/components/admin/ui";
import { saveModeration } from "../../actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
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
              rows={5}
              defaultValue={s.blocklist.join("\n")}
              className="w-full px-3 py-2 text-sm font-mono bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5]"
            />
          </label>
          <Button tone="primary">Save</Button>
        </form>
      </Card>

      <Card title="How it works">
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
