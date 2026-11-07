"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import type { RequestInspection, SeenHeader } from "@/lib/request-headers";

interface Echo extends RequestInspection {
  ok: boolean;
  ip: string;
  method: string;
  error?: string;
}

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function Rows({ rows }: { rows: SeenHeader[] }) {
  return (
    <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((h) => (
            <tr key={h.name} className="border-t first:border-t-0 border-[#1a1a1a] align-top">
              <td className="px-3 py-1.5 font-mono text-[#c084fc] whitespace-nowrap">{h.name}</td>
              <td className="px-3 py-1.5 min-w-[240px]">
                <span className="font-mono text-[#f5f5f5] break-all">{h.value}</span>
                {h.note && <span className="block text-[#777777] mt-0.5">{h.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RequestHeadersTestClient() {
  const [echo, setEcho] = useState<Echo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [origin, setOrigin] = useState("https://toolninja.io");

  const load = useCallback(async (extra?: [string, string]) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/echo-headers", { cache: "no-store", headers: extra ? { [extra[0]]: extra[1] } : undefined });
      const data = await res.json();
      if (!data.ok) setError(data.error || "Couldn't read the headers.");
      else setEcho(data);
    } catch (e) {
      // fetch() throws straight away on a name or value that isn't legal in a header
      setError(e instanceof TypeError && extra ? "That header name or value isn't valid, so the browser refused to send it." : "Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  const endpoint = `${origin}/api/echo-headers`;
  const curl = `# What curl sends
curl -s ${endpoint}

# Send your own header
curl -s -H "X-Test: hello" ${endpoint}

# Through a proxy: compare "ip" and the proxy headers with the direct result
curl -s -x http://proxy.example.com:8080 ${endpoint}`;
  const nginx = `# nginx: pass the real client on to your app, and only trust your own proxy
set_real_ip_from 10.0.0.0/8;   # the address range of your proxy or load balancer
real_ip_header X-Forwarded-For;
real_ip_recursive on;

location / {
    proxy_pass http://app:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`;

  const signals = echo?.proxySignals ?? [];

  return (
    <ToolLayout title="Request Headers & Proxy Test" description="See the exact headers a server receives from your browser, curl or code, and whether a proxy or CDN added its own">
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => load()} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[8px]">
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Send a new request
          </button>
          {echo && (
            <p className="text-sm text-[#bbbbbb]">
              The server sees you at <span className="font-mono text-[#f5f5f5]">{echo.ip}</span>
            </p>
          )}
        </div>
        {error && <p className="text-sm text-[#f87171]">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) load([name.trim(), value]);
          }}
          className="flex flex-wrap gap-2"
        >
          <input aria-label="Header name" value={name} onChange={(e) => setName(e.target.value)} placeholder="X-Test" spellCheck={false} className={`${field} w-44 font-mono`} />
          <input aria-label="Header value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="hello" spellCheck={false} className={`${field} flex-1 min-w-[160px] font-mono`} />
          <button type="submit" disabled={busy || !name.trim()} className="px-4 py-2 text-sm bg-[#1a1a1a] border border-[#222222] hover:bg-[#222222] disabled:opacity-50 text-[#f5f5f5] rounded-[8px]">
            Send with this header
          </button>
        </form>

        {echo && (
          <>
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
              {signals.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-[#fbbf24]">A proxy or CDN probably handled this request</p>
                  <p className="text-xs text-[#888888] mt-1">{signals.length} header{signals.length === 1 ? "" : "s"} below {signals.length === 1 ? "is" : "are"} usually added on the way.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#f5f5f5]">No proxy headers found</p>
                  <p className="text-xs text-[#888888] mt-1">That doesn&apos;t rule out a proxy: anonymous proxies and VPNs add nothing, so they only show up in the IP address. Compare it with what you expect.</p>
                </>
              )}
            </div>

            {signals.length > 0 && (
              <section>
                <h2 className="text-xs text-[#888888] font-medium mb-1">Proxy and CDN headers</h2>
                <Rows rows={signals} />
              </section>
            )}

            <section>
              <h2 className="text-xs text-[#888888] font-medium mb-1">Sent by the client</h2>
              <Rows rows={echo.headers} />
              {echo.withheld.length > 0 && <p className="text-xs text-[#666666] mt-1">Received but not shown, because they can hold credentials: <span className="font-mono">{echo.withheld.join(", ")}</span>.</p>}
            </section>

            {echo.forwarding.length > 0 && (
              <section>
                <h2 className="text-xs text-[#888888] font-medium mb-1">Forwarding headers</h2>
                <Rows rows={echo.forwarding} />
                <p className="text-xs text-[#666666] mt-1">This site&apos;s host sets these itself and replaces any you send, so a fake X-Forwarded-For won&apos;t show up here. It will on a server that trusts the header blindly, which is why your app should only trust it from your own proxy.</p>
              </section>
            )}
          </>
        )}

        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs text-[#888888] font-medium">Test from the command line</h2>
            <CopyButton text={curl} size="sm" />
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">{curl}</pre>
        </section>
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs text-[#888888] font-medium">Setting these headers correctly</h2>
            <CopyButton text={nginx} size="sm" />
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">{nginx}</pre>
        </section>

        <p className="text-xs text-[#666666]">
          Requests are answered and forgotten: headers and IP addresses aren&apos;t stored. To see what a site sends back instead, use the <Link href="/tools/http-header-inspector" className="text-[#a855f7] hover:underline">HTTP Header Inspector</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
