"use client";

import { useState, useTransition } from "react";
import { Send, ExternalLink } from "lucide-react";
import { telegramConnect, telegramDisconnect, telegramTest } from "@/app/admin/actions";

const btn = "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40";

export default function TelegramPanel({ configured, linked, username }: { configured: boolean; linked: boolean; username: string | null }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<{ code: string; username: string | null } | null>(null);
  const [msg, setMsg] = useState("");

  if (!configured) {
    return (
      <ol className="space-y-1.5 text-sm text-[#bbbbbb] list-decimal pl-5">
        <li>
          In Telegram, open <b>@BotFather</b> and send <code className="text-[#e9d5ff]">/newbot</code>.
        </li>
        <li>Pick a name and a username ending in “bot”. BotFather replies with a token.</li>
        <li>
          Add it in Vercel → Settings → Environment Variables as <code className="text-[#e9d5ff]">TELEGRAM_BOT_TOKEN</code> (Sensitive), then redeploy.
        </li>
        <li>Come back here and press Connect.</li>
      </ol>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#dddddd]">
        Bot: {username ? <b>@{username}</b> : <span className="text-[#f87171]">token rejected by Telegram</span>} ·{" "}
        {linked ? <span className="text-[#4ade80]">connected to your chat</span> : <span className="text-[#fbbf24]">not connected</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setMsg("");
              const r = await telegramConnect();
              if (r.ok && r.code) setLink({ code: r.code, username: r.username ?? null });
              else setMsg(r.error ?? "Couldn't connect.");
            })
          }
          className={`${btn} text-white bg-[#a855f7] border-[#a855f7] hover:bg-[#9333ea]`}
        >
          {linked ? "Reconnect" : "Connect"}
        </button>
        {linked && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => setMsg((await telegramTest()).ok ? "Sent — check Telegram." : "Couldn't send. Check Status."))}
              className={`${btn} flex items-center gap-1.5 text-[#dddddd] border-[#2e2e2e] bg-[#1a1a1a] hover:border-[#444]`}
            >
              <Send size={12} /> Send test message
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => (await telegramDisconnect(), setMsg("Disconnected.")))}
              className={`${btn} text-[#f87171] border-[#ef4444]/30 bg-[#ef4444]/10 hover:bg-[#ef4444]/20`}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
      {link && (
        <div className="p-4 bg-[#0a0a0a] border border-[#a855f7]/30 rounded-xl text-sm text-[#cccccc] space-y-2">
          {link.username && (
            <a
              href={`https://t.me/${link.username}?start=${link.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#229ED9] hover:bg-[#1c8cc2] rounded-lg"
            >
              Open @{link.username} in Telegram <ExternalLink size={13} />
            </a>
          )}
          <p>
            …and press <b>Start</b>. Or send it this message: <code className="font-mono text-[#e9d5ff]">/start {link.code}</code>
          </p>
          <p className="text-xs text-[#777777]">The code works once and expires in 15 minutes. Refresh this page after connecting.</p>
        </div>
      )}
      {msg && <p className="text-xs text-[#aaaaaa]">{msg}</p>}
    </div>
  );
}
