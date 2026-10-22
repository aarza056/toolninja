import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { kv } from "@/lib/kv";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const persistent = kv().persistent;
  return (
    <div className="px-4 sm:px-6 pt-20 md:pt-8 pb-16 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-xl font-bold text-[#f5f5f5]">
            Admin
          </Link>
          {!persistent && (
            <span className="px-2 py-0.5 text-[11px] text-[#fbbf24] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-full">
              Storage not connected — data resets on restart
            </span>
          )}
        </div>
        <form method="post" action="/api/admin/logout">
          <button className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#f5f5f5]">
            <LogOut size={13} /> Sign out
          </button>
        </form>
      </header>
      <AdminNav />
      <main className="mt-6">{children}</main>
    </div>
  );
}
