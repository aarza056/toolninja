"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

const MESSAGES: Record<string, string> = {
  invalid: "That doesn't look like an email address.",
  rate_limited: "Too many signups from your network — try again in an hour.",
  unavailable: "Signups are paused for a moment. Please try again later.",
  send_failed: "We couldn't send the confirmation email. Please try again later.",
};

export default function NewsletterSignup({ source, compact = false }: { source: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source, website }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (body.ok) setState("done");
      else {
        setState("error");
        setError(MESSAGES[body.reason ?? ""] ?? MESSAGES.unavailable);
      }
    } catch {
      setState("error");
      setError(MESSAGES.unavailable);
    }
  };

  if (state === "done") {
    return (
      <div className={`flex items-start gap-3 ${compact ? "" : "p-5"} bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[12px] p-4`}>
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#4ade80]" />
        <div>
          <p className="text-sm font-medium text-[#f5f5f5]">Almost there — check your inbox</p>
          <p className="text-xs text-[#aaaaaa] mt-0.5">Click the link in the email we just sent to {email} to confirm. Nothing arrived? Check spam.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`bg-[#0f0f10] border border-[#222222] rounded-[12px] ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-[#a855f7]" />
        <p className="text-sm font-semibold text-[#f5f5f5]">Get new tools in your inbox</p>
      </div>
      <p className="text-xs text-[#999999] mt-1">About once a month, when new tools ship. No spam, one-click unsubscribe.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor={`nl-${source}`}>
          Email address
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        {/* Honeypot: hidden from people and screen readers; bots tend to fill it */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-[8px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-60"
        >
          {state === "sending" && <Loader2 size={14} className="animate-spin" />} Subscribe
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-xs text-[#f87171]">{error}</p>}
      <p className="mt-2 text-[11px] text-[#666666]">
        We store only your email to send these updates.{" "}
        <Link href="/privacy#newsletter" className="underline hover:text-[#aaaaaa]">
          Privacy
        </Link>
      </p>
    </form>
  );
}
