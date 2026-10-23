import type { Metadata } from "next";
import { getSiteConfigFresh, bannerActive, FEATURE_FLAGS, type FeatureFlag } from "@/lib/site-config";
import { Badge, Button, Card } from "@/components/admin/ui";
import { saveBannerAction, saveFlagsAction } from "../../actions";

export const metadata: Metadata = { title: "Site" };
export const dynamic = "force-dynamic";

const field = "w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]/60";
const TONE_PREVIEW = {
  info: "bg-[#a855f7]/10 border-[#a855f7]/30 text-[#e9d5ff]",
  success: "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#bbf7d0]",
  warning: "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fde68a]",
};

export default async function SiteAdmin() {
  const { flags, banner } = await getSiteConfigFresh();
  const live = bannerActive(banner);
  const b = banner ?? { enabled: false, text: "", linkText: "", href: "", tone: "info" as const, until: "", id: "" };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Announcement banner" action={live ? <Badge tone="good">live</Badge> : <Badge>off</Badge>}>
        {b.text && (
          <div className={`mb-5 px-4 py-2 text-sm text-center border rounded-lg ${TONE_PREVIEW[b.tone]}`}>
            {b.text} {b.linkText && <u className="font-semibold">{b.linkText}</u>}
          </div>
        )}
        <form action={saveBannerAction} className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-[#dddddd]">
            <input type="checkbox" name="enabled" defaultChecked={b.enabled} className="accent-[#a855f7] w-4 h-4" />
            Show the banner at the top of every page
          </label>
          <label className="block text-xs text-[#aaaaaa]">
            Message
            <input name="text" defaultValue={b.text} maxLength={200} placeholder="New: rate any tool — your feedback shapes what we build next." className={`${field} mt-1`} />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs text-[#aaaaaa]">
              Link text (optional)
              <input name="linkText" defaultValue={b.linkText} maxLength={40} placeholder="See what's new" className={`${field} mt-1`} />
            </label>
            <label className="block text-xs text-[#aaaaaa]">
              Link (a path like /changelog, or https://…)
              <input name="href" defaultValue={b.href} maxLength={300} placeholder="/changelog" className={`${field} mt-1`} />
            </label>
            <label className="block text-xs text-[#aaaaaa]">
              Style
              <select name="tone" defaultValue={b.tone} className={`${field} mt-1`}>
                <option value="info">Purple — news</option>
                <option value="success">Green — good news</option>
                <option value="warning">Amber — heads up / maintenance</option>
              </select>
            </label>
            <label className="block text-xs text-[#aaaaaa]">
              Show until (optional, inclusive)
              <input type="date" name="until" defaultValue={b.until ? b.until.slice(0, 10) : ""} className={`${field} mt-1 [color-scheme:dark]`} />
            </label>
          </div>
          <p className="text-xs text-[#666666]">Visitors can dismiss it; saving a new version shows it to them again. Takes effect within seconds.</p>
          <Button tone="primary">Save banner</Button>
        </form>
      </Card>

      <Card title="Feature switches">
        <form action={saveFlagsAction} className="space-y-4">
          {(Object.keys(FEATURE_FLAGS) as FeatureFlag[]).map((k) => (
            <label key={k} className="flex items-start gap-3 text-sm text-[#dddddd]">
              <input type="checkbox" name={k} defaultChecked={flags[k]} className="mt-0.5 accent-[#a855f7] w-4 h-4" />
              <span>
                {FEATURE_FLAGS[k].label}
                <span className="block text-xs text-[#777777]">{FEATURE_FLAGS[k].hint}</span>
              </span>
            </label>
          ))}
          <Button tone="primary">Save switches</Button>
        </form>
      </Card>
    </div>
  );
}
