"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { YouTubeIcon } from "@/components/videos/PageVideos";
import { Badge, Card } from "@/components/admin/ui";
import { formatDuration, watchUrl, type Video } from "@/lib/videos";
import type { FetchedVideo } from "@/lib/youtube-info";
import { fetchVideo, removeVideoAction, saveVideoAction } from "../../video-actions";

const field = "w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-[#262626] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50";
const primary = `${btn} bg-[#a855f7] border-[#a855f7] text-white hover:bg-[#9333ea]`;
const neutral = `${btn} bg-[#1a1a1a] border-[#2e2e2e] text-[#dddddd] hover:border-[#444]`;

interface Draft {
  id: string;
  format: Video["format"];
  title: string;
  description: string;
  page: string;
  uploadDate: string;
  /** m:ss as typed */
  length: string;
  thumbnail: string;
}

const toDraft = (v: FetchedVideo | Video): Draft => ({
  id: v.id,
  format: v.format,
  title: v.title,
  description: v.description,
  page: v.page ?? "",
  uploadDate: v.uploadDate ?? "",
  length: v.durationSec ? formatDuration(v.durationSec) : "",
  thumbnail: v.thumbnail,
});

/** "0:33" / "2:05" / "75" → seconds */
function parseLength(s: string): number {
  const m = /^\s*(?:(\d+):)?(\d{1,2}|\d+)\s*$/.exec(s);
  if (!m) return NaN;
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}

function Thumb({ v, small }: { v: { thumbnail: string; format: Video["format"] }; small?: boolean }) {
  const vertical = v.format === "short";
  const w = small ? (vertical ? 45 : 80) : vertical ? 135 : 240;
  return (
    <div className="relative shrink-0 self-start overflow-hidden rounded-md border border-[#262626] bg-black" style={{ width: w, aspectRatio: vertical ? "9 / 16" : "16 / 9" }}>
      <Image src={v.thumbnail} alt="" fill sizes={`${w}px`} className="object-cover" />
    </div>
  );
}

export default function VideoManager({ videos, pages }: { videos: Video[]; pages: { path: string; name: string }[] }) {
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [noPageFound, setNoPageFound] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const pageName = (path: string) => pages.find((p) => p.path === path)?.name ?? path;

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  function onFetch() {
    setMessage(null);
    start(async () => {
      const r = await fetchVideo(url);
      if (!r.ok) {
        setMessage({ tone: "bad", text: r.error });
        return;
      }
      const existing = videos.find((v) => v.id === r.video.id);
      // Re-fetching a video that's already listed keeps the page and text you chose
      setDraft(existing ? { ...toDraft(r.video), page: existing.page, title: existing.title, description: existing.description } : toDraft(r.video));
      setIsNew(!existing);
      setNoPageFound(!existing && !r.video.page);
      if (existing) setMessage({ tone: "ok", text: "This video is already on the site. You're editing it." });
      else if (!r.video.durationSec || !r.video.uploadDate)
        setMessage({
          tone: "bad",
          text: `YouTube didn't report the ${!r.video.durationSec ? "length" : "publish date"} yet (new uploads can take a few minutes). Type it in below, or fetch again later.`,
        });
    });
  }

  function onSave() {
    if (!draft) return;
    setMessage(null);
    start(async () => {
      const r = await saveVideoAction(
        { id: draft.id, format: draft.format, title: draft.title, description: draft.description, page: draft.page, uploadDate: draft.uploadDate, durationSec: parseLength(draft.length), thumbnail: draft.thumbnail },
        isNew
      );
      if (!r.ok) {
        setMessage({ tone: "bad", text: r.error ?? "Couldn't save." });
        return;
      }
      setMessage({ tone: "ok", text: `${isNew ? "Added" : "Saved"}: live on ${pageName(draft.page)} and /videos within a few seconds.` });
      setDraft(null);
      setUrl("");
    });
  }

  function onRemove(v: Video) {
    if (!confirm(`Remove “${v.title}” from the site? It stays on YouTube.`)) return;
    start(async () => {
      await removeVideoAction(v.id);
      if (draft?.id === v.id) setDraft(null);
      setMessage({ tone: "ok", text: `Removed “${v.title}”.` });
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Add a video">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onFetch();
          }}
          className="flex gap-2"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube link: https://youtube.com/shorts/… or https://youtu.be/…"
            className={field}
            aria-label="YouTube link"
          />
          <button type="submit" disabled={pending || !url.trim()} className={primary}>
            {pending && !draft ? <Loader2 size={13} className="animate-spin" /> : <YouTubeIcon size={13} />} Fetch
          </button>
        </form>
        <p className="mt-2 text-xs text-[#666666]">
          Title, length, date, thumbnail and Short or horizontal are read from YouTube. The page is picked from the toolninja.io link in your
          YouTube description. You can change everything before adding.
        </p>
        {message && <p className={`mt-3 text-sm ${message.tone === "ok" ? "text-[#4ade80]" : "text-[#f87171]"}`}>{message.text}</p>}
      </Card>

      {draft && (
        <Card title={isNew ? "Check and add" : "Edit video"} action={<Badge tone={draft.format === "short" ? "info" : "good"}>{draft.format === "short" ? "Short" : "Horizontal"}</Badge>}>
          <div className="flex flex-col sm:flex-row gap-5">
            <Thumb v={draft} />
            <div className="flex-1 min-w-0 space-y-4">
              <label className="block text-xs text-[#aaaaaa]">
                Show on page
                <select value={draft.page} onChange={(e) => set({ page: e.target.value })} className={`${field} mt-1`}>
                  <option value="">Choose a page…</option>
                  {pages.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.name} ({p.path})
                    </option>
                  ))}
                </select>
                {noPageFound && !draft.page && <span className="block mt-1 text-[#fbbf24]">No toolninja.io link in the YouTube description, so pick the page.</span>}
              </label>
              <label className="block text-xs text-[#aaaaaa]">
                Title
                <input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} className={`${field} mt-1`} />
              </label>
              <label className="block text-xs text-[#aaaaaa]">
                Description (one or two sentences; Google shows it in video results)
                <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={400} rows={3} className={`${field} mt-1 resize-y`} />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs text-[#aaaaaa]">
                  Type
                  <select value={draft.format} onChange={(e) => set({ format: e.target.value as Video["format"] })} className={`${field} mt-1`}>
                    <option value="short">Short (vertical)</option>
                    <option value="guide">Horizontal</option>
                  </select>
                </label>
                <label className="block text-xs text-[#aaaaaa]">
                  Length (m:ss)
                  <input value={draft.length} onChange={(e) => set({ length: e.target.value })} placeholder="0:45" className={`${field} mt-1 font-mono`} />
                </label>
                <label className="block text-xs text-[#aaaaaa]">
                  Published
                  <input
                    type="date"
                    value={draft.uploadDate.slice(0, 10)}
                    onChange={(e) => set({ uploadDate: e.target.value === draft.uploadDate.slice(0, 10) ? draft.uploadDate : `${e.target.value}T12:00:00Z` })}
                    className={`${field} mt-1 [color-scheme:dark]`}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onSave} disabled={pending} className={primary}>
                  {pending && <Loader2 size={13} className="animate-spin" />} {isNew ? "Add to site" : "Save changes"}
                </button>
                <button type="button" onClick={() => setDraft(null)} disabled={pending} className={neutral}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card title={`On the site (${videos.length})`}>
        {videos.length === 0 ? (
          <p className="text-sm text-[#777777]">No videos yet.</p>
        ) : (
          <ul className="divide-y divide-[#1f1f1f]">
            {videos.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <Thumb v={v} small />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f5f5f5] truncate">{v.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#777777]">
                    <Badge tone={v.format === "short" ? "info" : "good"}>{v.format === "short" ? "Short" : "Horizontal"}</Badge>
                    <a href={v.page} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">
                      {pageName(v.page)}
                    </a>
                    <span>{v.uploadDate.slice(0, 10)}</span>
                    <span className="font-mono">{formatDuration(v.durationSec)}</span>
                    <a href={watchUrl(v)} target="_blank" rel="noopener noreferrer" className="hover:text-[#dddddd]">
                      YouTube ↗
                    </a>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(v));
                      setIsNew(false);
                      setNoPageFound(false);
                      setMessage(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={neutral}
                    aria-label={`Edit ${v.title}`}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button type="button" onClick={() => onRemove(v)} disabled={pending} className={`${btn} bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171] hover:bg-[#ef4444]/20`} aria-label={`Remove ${v.title}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
