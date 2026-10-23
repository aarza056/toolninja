import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Smartphone } from "lucide-react";
import { adminConfigured } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  wrong_password: "Wrong password.",
  wrong_code: "That code didn't work.",
  locked: "Too many wrong attempts — sign-in is locked for 30 minutes.",
  expired: "That took too long — enter your password again.",
  forbidden: "Request blocked.",
  unavailable: "Sign-in is temporarily unavailable (storage isn't responding). Try again in a minute.",
  not_configured: "Admin isn't configured: set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
};

const inputClass =
  "w-full px-3 py-2.5 mb-4 text-sm bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]/60";

export default function AdminLogin({ searchParams }: { searchParams: { error?: string; left?: string; step?: string } }) {
  const left = Number(searchParams.left);
  const codeStep = searchParams.step === "code";
  const base = searchParams.error ? ERRORS[searchParams.error] ?? "Couldn't sign in." : null;
  const error = base && left > 0 ? `${base} ${left} attempt${left === 1 ? "" : "s"} left before a 30-minute lock.` : base;
  const configured = adminConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form method="post" action="/api/admin/login" className="w-full max-w-sm p-7 bg-[#0f0f10] border border-[#1f1f1f] rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          {codeStep ? <Smartphone size={16} className="text-[#a855f7]" /> : <Lock size={16} className="text-[#a855f7]" />}
          <h1 className="text-lg font-bold text-[#f5f5f5]">{codeStep ? "Two-step sign-in" : "ToolNinja admin"}</h1>
        </div>
        <p className="text-xs text-[#777777] mb-6">
          {codeStep ? "Enter the 6-digit code from your authenticator app, or one of your backup codes." : "Only the site owner can sign in."}
        </p>
        {!configured && <p className="mb-4 text-xs text-[#fbbf24]">{ERRORS.not_configured}</p>}
        {error && configured && (
          <p role="alert" className="mb-4 text-xs text-[#f87171]">
            {error}
          </p>
        )}

        {codeStep ? (
          <>
            <input type="hidden" name="step" value="code" />
            <label htmlFor="code" className="block text-xs text-[#aaaaaa] mb-1.5">
              Code
            </label>
            <input
              id="code"
              name="code"
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="text"
              maxLength={16}
              placeholder="123456"
              className={`${inputClass} font-mono tracking-[0.3em] text-center text-lg`}
            />
          </>
        ) : (
          <>
            <label htmlFor="password" className="block text-xs text-[#aaaaaa] mb-1.5">
              Password
            </label>
            <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className={inputClass} />
          </>
        )}
        <button type="submit" disabled={!configured} className="w-full py-2.5 text-sm font-semibold text-white bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 rounded-lg transition-colors">
          {codeStep ? "Verify" : "Sign in"}
        </button>
        {codeStep && (
          <Link href="/admin/login" className="block mt-4 text-center text-xs text-[#777777] hover:text-[#f5f5f5]">
            Start over
          </Link>
        )}
      </form>
    </div>
  );
}
