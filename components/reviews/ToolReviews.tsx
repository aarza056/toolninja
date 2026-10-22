"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Check } from "lucide-react";

export interface ReviewData {
  count: number;
  avg: number;
  reviews: { id: string; stars: number; comment: string; ts: number }[];
}

const MIN_FOR_AVERAGE = 5;
const MAX_COMMENT = 500;
const MIN_TOKEN_AGE_MS = 3200; // the server rejects anything faster as a bot
const ratedKey = (slug: string) => `toolninja:rated:${slug}`;

const ago = (ts: number) => {
  const d = Math.round((Date.now() - ts) / 86400000);
  return d < 1 ? "today" : d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className={i <= Math.round(value) ? "text-[#fbbf24]" : "text-[#333333]"} fill="currentColor">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function ToolReviews({ slug, toolName, initial }: { slug: string; toolName: string; initial: ReviewData }) {
  const [hover, setHover] = useState(0);
  const [rated, setRated] = useState(0);
  const [phase, setPhase] = useState<"rate" | "comment" | "done">("rate");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const token = useRef<{ value: string; at: number } | null>(null);
  const tokenPromise = useRef<Promise<void> | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const prev = Number(localStorage.getItem(ratedKey(slug)));
      if (prev >= 1 && prev <= 5) {
        setRated(prev);
        setPhase("done");
      }
    } catch {}
  }, [slug]);

  const loadToken = () => {
    tokenPromise.current ??= fetch(`/api/reviews/token?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: { token?: string }) => {
        if (d.token) token.current = { value: d.token, at: Date.now() };
      })
      .catch(() => {
        tokenPromise.current = null;
      });
    return tokenPromise.current;
  };

  // Fetch the anti-bot token once the widget is actually on screen
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadToken();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const send = async (payload: Record<string, unknown>) => {
    await loadToken();
    if (!token.current) throw new Error("no token");
    const wait = MIN_TOKEN_AGE_MS - (Date.now() - token.current.at);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, slug, token: token.current.value, website: honeypot }),
    });
    return (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; status?: string; error?: string };
  };

  const rate = async (stars: number) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setRated(stars);
    try {
      const r = await send({ type: "rating", stars });
      if (!r.ok) throw new Error(r.error);
      try {
        localStorage.setItem(ratedKey(slug), String(stars));
      } catch {}
      setPhase("comment");
    } catch {
      setRated(0);
      setMessage("Couldn't save your rating — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    if (busy || comment.trim().length < 3) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await send({ type: "comment", stars: rated, comment: comment.trim() });
      if (r.ok) {
        setPhase("done");
        setMessage("Thanks! Your comment will appear after a quick review.");
      } else if (r.error === "paused") setMessage("Comments are paused right now — your rating was saved.");
      else if (r.error === "rate_limited") setMessage("You've left several comments recently — try again later.");
      else setMessage("Couldn't send your comment — please try again.");
    } catch {
      setMessage("Couldn't send your comment — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const showAverage = initial.count >= MIN_FOR_AVERAGE;
  const shown = hover || rated;

  return (
    <section ref={root} aria-labelledby="rate-heading" className="p-5 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="rate-heading" className="text-sm font-semibold text-[#f5f5f5]">
            {phase === "rate" ? `Was the ${toolName} helpful?` : "Thanks for rating!"}
          </h2>
          {showAverage && (
            <p className="mt-1 flex items-center gap-2 text-xs text-[#888888]">
              <StarRow value={initial.avg} size={13} />
              <span className="tabular-nums">
                {initial.avg.toFixed(1)} · {initial.count.toLocaleString()} ratings
              </span>
            </p>
          )}
        </div>

        {phase === "rate" ? (
          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rate this tool from 1 to 5 stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={rated === s}
                aria-label={`${s} star${s === 1 ? "" : "s"}`}
                disabled={busy}
                onMouseEnter={() => setHover(s)}
                onFocus={() => setHover(s)}
                onBlur={() => setHover(0)}
                onClick={() => rate(s)}
                className="p-1.5 -m-0.5 rounded-md hover:scale-110 transition-transform disabled:opacity-60"
              >
                <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden fill="currentColor" className={s <= shown ? "text-[#fbbf24]" : "text-[#2e2e2e]"}>
                  <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <span className="flex items-center gap-2 text-xs text-[#888888]">
            You rated <StarRow value={rated} size={14} />
          </span>
        )}
      </div>

      {phase === "comment" && (
        <div className="mt-4">
          <label htmlFor={`comment-${slug}`} className="flex items-center gap-1.5 text-xs text-[#aaaaaa] mb-1.5">
            <MessageSquare size={12} /> Add a comment <span className="text-[#666666]">(optional)</span>
          </label>
          <textarea
            id={`comment-${slug}`}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            rows={3}
            placeholder="What worked, what didn't, what's missing?"
            className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] placeholder:text-[#555555] focus:outline-none focus:border-[#a855f7]/60 resize-y"
          />
          {/* Honeypot: hidden from people and assistive tech; bots fill it in */}
          <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
            <p className="text-[11px] text-[#666666]">
              Reviewed before it appears · no links · don&apos;t paste tokens or keys · {comment.length}/{MAX_COMMENT}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPhase("done")} className="px-3 py-1.5 text-xs text-[#888888] hover:text-[#f5f5f5]">
                Skip
              </button>
              <button
                type="button"
                onClick={submitComment}
                disabled={busy || comment.trim().length < 3}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 rounded-lg transition-colors"
              >
                {busy ? "Sending…" : "Send comment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-[#aaaaaa]">
          {phase === "done" && <Check size={12} className="text-[#4ade80]" />} {message}
        </p>
      )}

      {initial.reviews.length > 0 && (
        <ul className="mt-5 pt-4 border-t border-[#1a1a1a] space-y-4">
          {initial.reviews.map((r) => (
            <li key={r.id}>
              <div className="flex items-center gap-2 mb-1">
                <StarRow value={r.stars} size={12} />
                <span className="text-[11px] text-[#666666]">{ago(r.ts)}</span>
              </div>
              <p className="text-sm text-[#cccccc] leading-relaxed whitespace-pre-wrap break-words">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
