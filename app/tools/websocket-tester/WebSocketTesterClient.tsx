"use client";

import { useState, useRef, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plug, Unplug, Send, Trash2, ArrowUpRight, ArrowDownLeft, Info } from "lucide-react";

type Status = "idle" | "connecting" | "open" | "closed";
type Direction = "sent" | "received" | "system" | "error";

interface LogEntry {
  id: number;
  time: Date;
  direction: Direction;
  text: string;
}

const STORAGE_KEY = "toolninja:websocket-tester";

const STATUS_STYLE: Record<Status, string> = {
  idle: "bg-[#555555]",
  connecting: "bg-[#f97316] animate-pulse",
  open: "bg-[#22c55e]",
  closed: "bg-[#ef4444]",
};

function tryPretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function describeBinary(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const preview: string[] = [];
  for (let i = 0; i < Math.min(bytes.length, 32); i++) preview.push(bytes[i].toString(16).padStart(2, "0"));
  return `[binary, ${bytes.length} bytes] ${preview.join(" ")}${bytes.length > 32 ? " …" : ""}`;
}

export default function WebSocketTesterClient() {
  const [url, setUrl] = useState("wss://echo.websocket.org");
  const [protocols, setProtocols] = useState("");
  const [message, setMessage] = useState('{"type":"ping"}');
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pretty, setPretty] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url) setUrl(parsed.url);
        if (parsed.message) setMessage(parsed.message);
        if (parsed.protocols) setProtocols(parsed.protocols);
      }
    } catch {}
    return () => socketRef.current?.close();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, message, protocols }));
    } catch {}
  }, [url, message, protocols]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [log]);

  const append = (direction: Direction, text: string) => {
    idRef.current += 1;
    const entry = { id: idRef.current, time: new Date(), direction, text };
    setLog((prev) => [...prev.slice(-499), entry]);
  };

  const connect = () => {
    if (!/^wss?:\/\//i.test(url.trim())) {
      append("error", "URL must start with ws:// or wss://");
      return;
    }
    socketRef.current?.close();
    const protoList = protocols.split(",").map((p) => p.trim()).filter(Boolean);
    let ws: WebSocket;
    try {
      ws = protoList.length ? new WebSocket(url.trim(), protoList) : new WebSocket(url.trim());
    } catch (e) {
      append("error", e instanceof Error ? e.message : "Couldn't create the connection");
      return;
    }
    ws.binaryType = "arraybuffer";
    socketRef.current = ws;
    setStatus("connecting");
    append("system", `Connecting to ${url.trim()}…`);

    ws.onopen = () => {
      setStatus("open");
      append("system", `Connected${ws.protocol ? ` (subprotocol: ${ws.protocol})` : ""}`);
    };
    ws.onmessage = (ev) => {
      append("received", typeof ev.data === "string" ? ev.data : describeBinary(ev.data as ArrayBuffer));
    };
    ws.onerror = () => {
      append("error", "Connection error — the browser hides the details; check the URL, the server, and the console");
    };
    ws.onclose = (ev) => {
      setStatus("closed");
      append("system", `Closed — code ${ev.code}${ev.reason ? `, reason: ${ev.reason}` : ""}${ev.wasClean ? "" : " (not clean)"}`);
      if (socketRef.current === ws) socketRef.current = null;
    };
  };

  const disconnect = () => socketRef.current?.close(1000, "Closed by user");

  const send = () => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !message) return;
    ws.send(message);
    append("sent", message);
  };

  const connected = status === "open" || status === "connecting";

  return (
    <ToolLayout
      title="WebSocket Tester"
      description="Connect to any ws:// or wss:// endpoint, send messages, and watch a live, timestamped log — right in your browser"
    >
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[260px]">
          <label className="flex items-center gap-2 text-xs text-[#888888] font-medium mb-1">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_STYLE[status]}`} /> Endpoint URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={connected}
            spellCheck={false}
            className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] disabled:opacity-60"
          />
        </div>
        <div className="w-48">
          <label className="text-xs text-[#888888] font-medium block mb-1">Subprotocols (optional)</label>
          <input
            type="text"
            value={protocols}
            onChange={(e) => setProtocols(e.target.value)}
            disabled={connected}
            placeholder="graphql-ws, v1"
            spellCheck={false}
            className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] disabled:opacity-60"
          />
        </div>
        {connected ? (
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Unplug size={14} /> Disconnect
          </button>
        ) : (
          <button
            onClick={connect}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <Plug size={14} /> Connect
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#888888] font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={8}
            spellCheck={false}
            className="w-full p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#555555]">Ctrl/⌘ + Enter to send</span>
            <button
              onClick={send}
              disabled={status !== "open" || !message}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 text-white rounded-[6px] transition-colors"
            >
              <Send size={13} /> Send
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Log ({log.length})</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
                <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} className="accent-[#a855f7]" />
                Pretty-print JSON
              </label>
              <button onClick={() => setLog([])} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>
          <div className="h-[420px] overflow-auto p-2 bg-[#0d0d0d] border border-[#222222] rounded-[8px] space-y-1">
            {log.length === 0 && <p className="p-4 text-center text-sm text-[#444444]">Connect to an endpoint to start the log</p>}
            {log.map((entry) => {
              const text = pretty && (entry.direction === "sent" || entry.direction === "received") ? tryPretty(entry.text) : entry.text;
              return (
                <div
                  key={entry.id}
                  className={`group flex gap-2 px-2 py-1.5 rounded text-xs ${
                    entry.direction === "error" ? "bg-[#ef4444]/10" : entry.direction === "system" ? "" : "bg-[#111111]"
                  }`}
                >
                  <span className="shrink-0 font-mono text-[#555555]">{entry.time.toLocaleTimeString([], { hour12: false })}</span>
                  <span className="shrink-0 mt-0.5">
                    {entry.direction === "sent" && <ArrowUpRight size={12} className="text-[#a855f7]" />}
                    {entry.direction === "received" && <ArrowDownLeft size={12} className="text-[#22c55e]" />}
                    {(entry.direction === "system" || entry.direction === "error") && (
                      <Info size={12} className={entry.direction === "error" ? "text-[#ef4444]" : "text-[#555555]"} />
                    )}
                  </span>
                  <pre
                    className={`flex-1 min-w-0 font-mono whitespace-pre-wrap break-all ${
                      entry.direction === "system" ? "text-[#888888]" : entry.direction === "error" ? "text-[#ef4444]" : "text-[#f5f5f5]"
                    }`}
                  >
                    {text}
                  </pre>
                  {(entry.direction === "sent" || entry.direction === "received") && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={entry.text} size="sm" />
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#555555] leading-relaxed">
        The connection is made directly from your browser — no proxy in between. Because this page is served over HTTPS, browsers
        only allow secure <code className="text-[#888888]">wss://</code> endpoints (plus <code className="text-[#888888]">ws://localhost</code>{" "}
        in most browsers). Custom request headers can&apos;t be set from a browser WebSocket; pass tokens via the URL query or the first
        message instead.
      </p>
    </ToolLayout>
  );
}
