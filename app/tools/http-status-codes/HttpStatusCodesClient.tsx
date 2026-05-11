"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Search } from "lucide-react";

interface StatusCode {
  code: number;
  name: string;
  description: string;
}

const STATUS_CODES: StatusCode[] = [
  // 1xx Informational
  { code: 100, name: "Continue", description: "The server has received the request headers and the client should proceed to send the request body." },
  { code: 101, name: "Switching Protocols", description: "The requester has asked the server to switch protocols and the server has agreed to do so." },
  { code: 102, name: "Processing", description: "The server has received and is processing the request, but no response is available yet." },
  { code: 103, name: "Early Hints", description: "Used with the Link header to allow the user agent to start preloading resources while the server prepares a response." },

  // 2xx Success
  { code: 200, name: "OK", description: "The request has succeeded. The meaning of the success depends on the HTTP method used." },
  { code: 201, name: "Created", description: "The request has succeeded and a new resource has been created as a result." },
  { code: 202, name: "Accepted", description: "The request has been received but not yet acted upon. It may be acted on or not allowed when processing occurs." },
  { code: 203, name: "Non-Authoritative Information", description: "The returned metadata is not exactly the same as is available from the origin server, but is collected from a local or third-party copy." },
  { code: 204, name: "No Content", description: "There is no content to send for this request, but the headers may be useful. The user agent may update its cached headers for this resource." },
  { code: 205, name: "Reset Content", description: "Tells the user agent to reset the document which sent this request." },
  { code: 206, name: "Partial Content", description: "This response code is used when the Range header is sent from the client to request only part of a resource." },
  { code: 207, name: "Multi-Status", description: "Conveys information about multiple resources, for situations where multiple status codes might be appropriate." },
  { code: 208, name: "Already Reported", description: "Used inside a <dav:propstat> response element to avoid enumerating the internal members of multiple bindings to the same collection repeatedly." },
  { code: 226, name: "IM Used", description: "The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance." },

  // 3xx Redirection
  { code: 300, name: "Multiple Choices", description: "The request has more than one possible response. The user agent or user should choose one of them." },
  { code: 301, name: "Moved Permanently", description: "The URL of the requested resource has been changed permanently. The new URL is given in the response." },
  { code: 302, name: "Found", description: "The URI of requested resource has been changed temporarily. Further changes in the URI might be made in the future." },
  { code: 303, name: "See Other", description: "The server sent this response to direct the client to get the requested resource at another URI with a GET request." },
  { code: 304, name: "Not Modified", description: "This is used for caching purposes. It tells the client that the response has not been modified, so the client can continue to use the same cached version of the response." },
  { code: 305, name: "Use Proxy", description: "Defined in a previous version of the HTTP specification to indicate that a requested response must be accessed by a proxy. Deprecated." },
  { code: 307, name: "Temporary Redirect", description: "The server sends this response to direct the client to get the requested resource at another URI with the same method that was used in the prior request." },
  { code: 308, name: "Permanent Redirect", description: "The resource is now permanently located at another URI, specified by the Location response header. This is the same as 301 but the HTTP method must not change." },

  // 4xx Client Errors
  { code: 400, name: "Bad Request", description: "The server cannot or will not process the request due to something that is perceived to be a client error." },
  { code: 401, name: "Unauthorized", description: "Although the HTTP standard specifies 'unauthorized', semantically this response means 'unauthenticated'." },
  { code: 402, name: "Payment Required", description: "Reserved for future use. Some services use this code to indicate that the client must pay to access the requested resource." },
  { code: 403, name: "Forbidden", description: "The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource." },
  { code: 404, name: "Not Found", description: "The server can not find the requested resource. This response code is perhaps the most well-known due to its frequent occurrence on the web." },
  { code: 405, name: "Method Not Allowed", description: "The request method is known by the server but is not supported by the target resource." },
  { code: 406, name: "Not Acceptable", description: "The server cannot produce a response matching the list of acceptable values defined in the request's proactive content negotiation headers." },
  { code: 407, name: "Proxy Authentication Required", description: "Similar to 401 Unauthorized but authentication is needed to be done by a proxy." },
  { code: 408, name: "Request Timeout", description: "The server did not receive a complete request message within the time that it was prepared to wait." },
  { code: 409, name: "Conflict", description: "The request conflicts with the current state of the server." },
  { code: 410, name: "Gone", description: "The content has been permanently deleted from server, with no forwarding address. Clients should remove their caches and links to the resource." },
  { code: 411, name: "Length Required", description: "The server rejects the request because the Content-Length header field is not defined and the server requires it." },
  { code: 412, name: "Precondition Failed", description: "The client has indicated preconditions in its headers which the server does not meet." },
  { code: 413, name: "Content Too Large", description: "The request body is larger than limits defined by the server. The server may close the connection or return a Retry-After header field." },
  { code: 414, name: "URI Too Long", description: "The URI requested by the client is longer than the server is willing to interpret." },
  { code: 415, name: "Unsupported Media Type", description: "The media format of the requested data is not supported by the server, so the server is rejecting the request." },
  { code: 416, name: "Range Not Satisfiable", description: "The range specified by the Range header field in the request cannot be fulfilled. It's possible that the range is outside the size of the target URI's data." },
  { code: 417, name: "Expectation Failed", description: "The expectation given in the request's Expect header could not be met by at least one of the inbound servers." },
  { code: 418, name: "I'm a Teapot", description: "The server refuses the attempt to brew coffee with a teapot. Defined as an April Fools' joke in RFC 2324 and is not expected to be implemented by actual HTTP servers." },
  { code: 421, name: "Misdirected Request", description: "The request was directed at a server that is not able to produce a response. This can be sent by a server that is not configured to produce responses for the combination of scheme and authority." },
  { code: 422, name: "Unprocessable Content", description: "The request was well-formed but was unable to be followed due to semantic errors." },
  { code: 423, name: "Locked", description: "The resource that is being accessed is locked." },
  { code: 424, name: "Failed Dependency", description: "The request failed due to failure of a previous request." },
  { code: 425, name: "Too Early", description: "Indicates that the server is unwilling to risk processing a request that might be replayed." },
  { code: 426, name: "Upgrade Required", description: "The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol." },
  { code: 428, name: "Precondition Required", description: "The origin server requires the request to be conditional. This response is intended to prevent the 'lost update' problem." },
  { code: 429, name: "Too Many Requests", description: "The user has sent too many requests in a given amount of time (rate limiting)." },
  { code: 431, name: "Request Header Fields Too Large", description: "The server is unwilling to process the request because its header fields are too large." },
  { code: 451, name: "Unavailable For Legal Reasons", description: "The user agent requested a resource that cannot legally be provided, such as a web page censored by a government." },

  // 5xx Server Errors
  { code: 500, name: "Internal Server Error", description: "The server has encountered a situation it does not know how to handle." },
  { code: 501, name: "Not Implemented", description: "The request method is not supported by the server and cannot be handled. The only methods that servers are required to support are GET and HEAD." },
  { code: 502, name: "Bad Gateway", description: "The server, while working as a gateway to get a response needed to handle the request, got an invalid response." },
  { code: 503, name: "Service Unavailable", description: "The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded." },
  { code: 504, name: "Gateway Timeout", description: "The server is acting as a gateway and cannot get a response in time." },
  { code: 505, name: "HTTP Version Not Supported", description: "The HTTP version used in the request is not supported by the server." },
  { code: 506, name: "Variant Also Negotiates", description: "The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself." },
  { code: 507, name: "Insufficient Storage", description: "The method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request." },
  { code: 508, name: "Loop Detected", description: "The server detected an infinite loop while processing the request." },
  { code: 510, name: "Not Extended", description: "Further extensions to the request are required for the server to fulfil it." },
  { code: 511, name: "Network Authentication Required", description: "Indicates that the client needs to authenticate to gain network access." },
];

type Category = "all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "1xx", label: "1xx" },
  { value: "2xx", label: "2xx" },
  { value: "3xx", label: "3xx" },
  { value: "4xx", label: "4xx" },
  { value: "5xx", label: "5xx" },
];

function getCategoryClass(code: number): string {
  if (code < 200) return "text-[#60a5fa]"; // blue
  if (code < 300) return "text-[#22c55e]"; // green
  if (code < 400) return "text-[#f59e0b]"; // amber
  if (code < 500) return "text-[#f97316]"; // orange
  return "text-[#ef4444]";                  // red
}

function getCategoryBorder(code: number): string {
  if (code < 200) return "border-[#60a5fa]/20 hover:border-[#60a5fa]/40";
  if (code < 300) return "border-[#22c55e]/20 hover:border-[#22c55e]/40";
  if (code < 400) return "border-[#f59e0b]/20 hover:border-[#f59e0b]/40";
  if (code < 500) return "border-[#f97316]/20 hover:border-[#f97316]/40";
  return "border-[#ef4444]/20 hover:border-[#ef4444]/40";
}

function getCategoryBadge(code: number): string {
  if (code < 200) return "bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/30";
  if (code < 300) return "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30";
  if (code < 400) return "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30";
  if (code < 500) return "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30";
  return "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30";
}

const CATEGORY_LABELS: Record<string, string> = {
  "1": "Informational",
  "2": "Success",
  "3": "Redirection",
  "4": "Client Error",
  "5": "Server Error",
};

export default function HttpStatusCodesClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return STATUS_CODES.filter((s) => {
      const catPrefix = Math.floor(s.code / 100).toString();
      const matchesCat = category === "all" || category.startsWith(catPrefix);
      const matchesSearch =
        !q ||
        s.code.toString().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [search, category]);

  // Group by century for display
  const grouped = useMemo(() => {
    const map = new Map<string, StatusCode[]>();
    for (const s of filtered) {
      const key = Math.floor(s.code / 100).toString() + "xx";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [filtered]);

  return (
    <ToolLayout
      title="HTTP Status Codes"
      description="Complete reference for all standard HTTP status codes with descriptions."
    >
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or description..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
          />
        </div>
        <div className="flex">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                category === cat.value
                  ? "bg-[#a855f7] border-[#a855f7] text-white"
                  : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-[#555555] mb-4">
        Showing <span className="text-[#888888]">{filtered.length}</span> of{" "}
        <span className="text-[#888888]">{STATUS_CODES.length}</span> status codes
      </p>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-[#555555]">
          No status codes match your search.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([groupKey, codes]) => {
            const century = groupKey[0];
            return (
              <section key={groupKey}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-[#f5f5f5]">
                    {groupKey} — {CATEGORY_LABELS[century] ?? "Unknown"}
                  </h2>
                  <div className="flex-1 h-px bg-[#222222]" />
                  <span className="text-xs text-[#555555]">{codes.length} codes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {codes.map((s) => (
                    <div
                      key={s.code}
                      className={`group flex flex-col p-4 bg-[#111111] border rounded-[8px] transition-colors ${getCategoryBorder(s.code)}`}
                    >
                      {/* Code + Copy */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-mono text-xl font-bold ${getCategoryClass(s.code)}`}>
                            {s.code}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border ${getCategoryBadge(s.code)}`}>
                            {groupKey}
                          </span>
                        </div>
                        <CopyButton text={String(s.code)} size="sm" />
                      </div>

                      {/* Name */}
                      <p className="text-sm font-semibold text-[#f5f5f5] mb-2 leading-snug">
                        {s.name}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-[#888888] leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </ToolLayout>
  );
}
