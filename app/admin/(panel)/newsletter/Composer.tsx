"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { previewNewsletter, sendNewsletterTest, sendNewsletterToAll, type DraftInput } from "../../newsletter-actions";
import { Send, FlaskConical, Monitor, Smartphone, Loader2 } from "lucide-react";

interface ReleaseOption {
  date: string;
  title: string;
  draft: Omit<DraftInput, "releaseDate">;
}

const DRAFT_KEY = "toolninja:admin:newsletter-draft";
const field = "w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-[#262626] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

/** Renders the email in a shadow root so the admin page's CSS can't change how it looks. */
function EmailPreview({ html, width }: { html: string; width: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const root = host.current.shadowRoot ?? host.current.attachShadow({ mode: "open" });
    // The template is our own markup with every user value escaped
    root.innerHTML = html;
  }, [html]);
  return (
    <div className="mx-auto bg-[#f4f4f5] rounded-lg overflow-hidden transition-all" style={{ maxWidth: width }}>
      <div ref={host} />
    </div>
  );
}

export default function Composer({ releases, subscribers, defaultTestTo }: { releases: ReleaseOption[]; subscribers: number; defaultTestTo: string }) {
  const [releaseDate, setReleaseDate] = useState(releases[0]?.date ?? "");
  const [subject, setSubject] = useState(releases[0]?.draft.subject ?? "");
  const [preheader, setPreheader] = useState(releases[0]?.draft.preheader ?? "");
  const [intro, setIntro] = useState(releases[0]?.draft.intro ?? "");
  const [html, setHtml] = useState("");
  const [width, setWidth] = useState(640);
  const [testTo, setTestTo] = useState(defaultTestTo);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const loaded = useRef(false);

  // Restore an unsent draft
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as DraftInput | null;
      if (d && releases.some((r) => r.date === d.releaseDate)) {
        setReleaseDate(d.releaseDate);
        setSubject(d.subject);
        setPreheader(d.preheader);
        setIntro(d.intro);
      }
    } catch {}
    loaded.current = true;
  }, [releases]);

  const draft: DraftInput = { subject, preheader, intro, releaseDate };

  useEffect(() => {
    if (loaded.current) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, preheader, intro, releaseDate }));
      } catch {}
    }
    const id = setTimeout(() => {
      previewNewsletter({ subject, preheader, intro, releaseDate }).then((r) => setHtml(r.html)).catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [subject, preheader, intro, releaseDate]);

  const loadRelease = (date: string) => {
    const r = releases.find((x) => x.date === date);
    if (!r) return;
    setReleaseDate(date);
    setSubject(r.draft.subject);
    setPreheader(r.draft.preheader);
    setIntro(r.draft.intro);
  };

  const test = () =>
    start(async () => {
      setMessage(null);
      const r = await sendNewsletterTest(draft, testTo);
      setMessage(r.ok ? { tone: "ok", text: `Test sent to ${testTo}. Check the inbox (and spam).` } : { tone: "bad", text: r.error ?? "Couldn't send." });
    });

  const sendAll = () => {
    if (!window.confirm(`Send “${subject}” to ${subscribers} subscriber${subscribers === 1 ? "" : "s"}?\n\nThis can't be undone.`)) return;
    start(async () => {
      setMessage(null);
      const r = await sendNewsletterToAll(draft, subscribers);
      if (r.ok) {
        setMessage({ tone: "ok", text: `Sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}.` });
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      } else setMessage({ tone: "bad", text: r.error ? `${r.error}${r.sent ? ` (${r.sent} sent, ${r.failed} failed)` : ""}` : "Couldn't send." });
    });
  };

  return (
    <div className="grid xl:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="space-y-3">
        <label className="block">
          <span className="block text-xs text-[#888888] mb-1">Release</span>
          <select value={releaseDate} onChange={(e) => loadRelease(e.target.value)} className={field}>
            {releases.map((r) => (
              <option key={r.date} value={r.date}>
                {r.date} · {r.title}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-[#666666] mt-1">Picking a release rewrites the draft from the changelog. The tool list always comes from the changelog.</span>
        </label>
        <label className="block">
          <span className="block text-xs text-[#888888] mb-1">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={field} />
        </label>
        <label className="block">
          <span className="block text-xs text-[#888888] mb-1">Inbox preview text</span>
          <input value={preheader} onChange={(e) => setPreheader(e.target.value)} maxLength={200} className={field} />
        </label>
        <label className="block">
          <span className="block text-xs text-[#888888] mb-1">Intro (blank line = new paragraph)</span>
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={6} className={field} />
        </label>

        <div className="pt-2 space-y-2">
          <div className="flex gap-2">
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" className={field} aria-label="Send test to" />
            <button onClick={test} disabled={pending} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] text-[#dddddd] hover:border-[#444] disabled:opacity-50">
              <FlaskConical size={13} /> Send test
            </button>
          </div>
          <button
            onClick={sendAll}
            disabled={pending || subscribers === 0}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-40"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send to {subscribers} subscriber{subscribers === 1 ? "" : "s"}
          </button>
          {message && <p className={`text-xs ${message.tone === "ok" ? "text-[#4ade80]" : "text-[#f87171]"}`}>{message.text}</p>}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#888888]">Preview</p>
          <div className="flex gap-1">
            <button onClick={() => setWidth(640)} aria-label="Desktop width" className={`p-1.5 rounded ${width === 640 ? "text-[#a855f7] bg-[#a855f7]/10" : "text-[#777777]"}`}>
              <Monitor size={14} />
            </button>
            <button onClick={() => setWidth(375)} aria-label="Phone width" className={`p-1.5 rounded ${width === 375 ? "text-[#a855f7] bg-[#a855f7]/10" : "text-[#777777]"}`}>
              <Smartphone size={14} />
            </button>
          </div>
        </div>
        {html ? <EmailPreview html={html} width={width} /> : <p className="text-xs text-[#666666]">Loading preview…</p>}
      </div>
    </div>
  );
}
