import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { adminConfigured } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  wrong: "Wrong password.",
  locked: "Too many wrong passwords — sign-in is locked for 30 minutes.",
  forbidden: "Request blocked.",
  not_configured: "Admin isn't configured: set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
};

export default function AdminLogin({ searchParams }: { searchParams: { error?: string; left?: string } }) {
  const left = Number(searchParams.left);
  const error = searchParams.error
    ? searchParams.error === "wrong" && left > 0
      ? `Wrong password. ${left} attempt${left === 1 ? "" : "s"} left before a 30-minute lock.`
      : ERRORS[searchParams.error] ?? "Couldn't sign in."
    : null;
  const configured = adminConfigured();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form method="post" action="/api/admin/login" className="w-full max-w-sm p-7 bg-[#0f0f10] border border-[#1f1f1f] rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={16} className="text-[#a855f7]" />
          <h1 className="text-lg font-bold text-[#f5f5f5]">ToolNinja admin</h1>
        </div>
        <p className="text-xs text-[#777777] mb-6">Only the site owner can sign in.</p>
        {!configured && <p className="mb-4 text-xs text-[#fbbf24]">{ERRORS.not_configured}</p>}
        {error && configured && (
          <p role="alert" className="mb-4 text-xs text-[#f87171]">
            {error}
          </p>
        )}
        <label htmlFor="password" className="block text-xs text-[#aaaaaa] mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full px-3 py-2.5 mb-4 text-sm bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]/60"
        />
        <button type="submit" disabled={!configured} className="w-full py-2.5 text-sm font-semibold text-white bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 rounded-lg transition-colors">
          Sign in
        </button>
      </form>
    </div>
  );
}
