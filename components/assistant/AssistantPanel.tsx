"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ImagePlus, X, Sparkles, ShieldAlert, ArrowRight, BookOpen, Lock, RotateCcw } from "lucide-react";
import { tools } from "@/lib/tools";
import { detectLocal, looksLikeQuestion, type Detection } from "@/lib/detect";
import { matchTools } from "@/lib/tool-match";
import { scanForSecrets } from "@/lib/secret-scanner";
import { decodeQrFromImage } from "@/lib/qr-decode";
import type { ErrorArticleIndex } from "@/lib/error-matcher";
import type { CloudMode } from "./ParticleCloud";
import PatreonLink from "@/components/support/PatreonLink";

interface AiResult {
  answer: string;
  tools: { slug: string; reason: string }[];
  guides: string[];
}

interface Turn {
  id: number;
  question: string;
  imagePreview: string;
  status: "thinking" | "answered" | "failed";
  result?: AiResult;
  error?: string;
  reason?: string;
}

const PLACEHOLDERS = [
  "Paste a JWT, a cron expression, a certificate, a cURL command…",
  "…or an error message from your terminal",
  "…or describe your problem: “convert my docker run command to compose”",
];

const FAIL_MESSAGES: Record<string, string> = {
  rate_limited: "You've asked a lot in a short time — try again in a few minutes.",
  daily_cap: "Ninja AI has hit its daily limit. It'll be back tomorrow — the local detection still works.",
  budget: "Ninja AI has used this month's budget. It'll be back next month — the local detection still works.",
  refusal: "I can't help with that one. Try rephrasing it as a developer question.",
  image_too_large: "That image is too large — try a smaller screenshot.",
  default: "Ninja AI is unavailable right now. Try again in a moment.",
};

const SENSITIVE_IDS = new Set(["jwt", "pem-key", "otpauth", "connection-string", "card"]);
const TYPE_STEP = 2;
const TYPE_INTERVAL_MS = 22;

const toolBySlug = new Map(tools.map((t) => [t.slug, t]));

async function downscaleImage(file: File, maxSide = 1280): Promise<{ mediaType: "image/jpeg"; data: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * ratio);
    canvas.height = Math.round(img.naturalHeight * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { mediaType: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.85).split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ToolChip({ slug, reason }: { slug: string; reason?: string }) {
  const tool = toolBySlug.get(slug);
  if (!tool) return null;
  return (
    <Link
      href={`/tools/${slug}`}
      className="group flex items-start gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/50 transition-colors"
    >
      <ArrowRight size={13} className="mt-0.5 shrink-0 text-[#a855f7]" />
      <span className="min-w-0">
        <span className="block text-sm text-[#f5f5f5] group-hover:text-[#a855f7] transition-colors">{tool.name}</span>
        {reason && <span className="block text-xs text-[#777777] leading-snug">{reason}</span>}
      </span>
    </Link>
  );
}

function DetectionCard({ d }: { d: Detection }) {
  return (
    <div className="p-4 bg-[#0f0f10] border border-[#222222] rounded-[10px] space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-[#f5f5f5]">{d.label}</span>
        <span
          className={`px-1.5 py-0.5 text-[10px] uppercase tracking-wide rounded ${
            d.confidence === "high" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#f97316]/10 text-[#f97316]"
          }`}
        >
          {d.confidence === "high" ? "detected" : "best guess"}
        </span>
      </div>
      <p className="text-sm text-[#aaaaaa] break-words">{d.summary}</p>
      {d.fields.length > 0 && (
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
          {d.fields.slice(0, 5).map((f) => (
            <div key={f.label} className="contents">
              <dt className="text-[#666666]">{f.label}</dt>
              <dd className="text-[#cccccc] font-mono break-all">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {d.warning && (
        <p className="flex items-start gap-1.5 text-xs text-[#f97316]">
          <ShieldAlert size={13} className="mt-0.5 shrink-0" /> {d.warning}
        </p>
      )}
      {d.guides && d.guides.length > 0 && (
        <div className="space-y-1">
          {d.guides.map((g) => (
            <Link key={g.slug} href={`/blog/${g.slug}`} className="flex items-start gap-1.5 text-xs text-[#888888] hover:text-[#a855f7]">
              <BookOpen size={12} className="mt-0.5 shrink-0" /> {g.title}
            </Link>
          ))}
        </div>
      )}
      {d.tools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {d.tools.slice(0, 4).map((slug) => (
            <ToolChip key={slug} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingDots({ line }: { line: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
      <span className="text-sm text-[#c4a5f7]">{line}</span>
    </div>
  );
}

interface Props {
  variant?: "full" | "compact";
  onCloudMode?: (mode: CloudMode) => void;
  autoFocus?: boolean;
}

export default function AssistantPanel({ variant = "full", onCloudMode, autoFocus = false }: Props) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [qrText, setQrText] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [searchedLocally, setSearchedLocally] = useState(false);
  const [articles, setArticles] = useState<ErrorArticleIndex[]>([]);
  // null = not known yet; assume available so the button never flickers from "Find tools" to "Ask"
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const aiAvailable = aiEnabled !== false;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [typed, setTyped] = useState(0); // characters revealed of the latest answer
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [secretAck, setSecretAck] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const last = turns[turns.length - 1];
  const lastAnswer = last?.status === "answered" ? last.result?.answer ?? "" : "";
  const thinking = last?.status === "thinking";
  const typing = last?.status === "answered" && typed < lastAnswer.length;
  // The input stays locked from sending a question until its answer has finished typing
  const busy = thinking || typing;
  const inConversation = turns.length > 0;

  useEffect(() => {
    fetch("/guides-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ErrorArticleIndex[]) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
    fetch("/api/assist")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => setAiEnabled(Boolean(data.enabled)))
      .catch(() => setAiEnabled(false));
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Local analysis of the composer: runs on every edit (debounced), entirely in the browser
  const source = text.trim() || qrText;
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      if (!source) {
        setDetections([]);
        setMatches([]);
        return;
      }
      const found = await detectLocal(source, articles);
      if (cancelled) return;
      setDetections(found);
      const strong = found.some((d) => d.confidence === "high" && d.id !== "error");
      setMatches(!strong && looksLikeQuestion(source) && !inConversation ? matchTools(source, 4).map((t) => t.slug) : []);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [source, articles, inConversation]);

  useEffect(() => {
    if (thinking) onCloudMode?.("thinking");
    else if (typing) onCloudMode?.("speaking");
    else onCloudMode?.("idle");
  }, [thinking, typing, onCloudMode]);

  useEffect(() => {
    if (!thinking) return;
    const id = setInterval(() => setThinkingIdx((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [thinking]);

  // Typewriter reveal of the latest answer
  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(() => setTyped((n) => Math.min(n + TYPE_STEP, lastAnswer.length)), TYPE_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [typing, typed, lastAnswer.length]);

  // Bring each new question into view, and hand focus back once its answer has finished
  useEffect(() => {
    if (turns.length) lastTurnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [turns.length]);
  useEffect(() => {
    if (inConversation && !busy) textRef.current?.focus();
  }, [inConversation, busy]);

  const setImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setQrText("");
    try {
      const qr = await decodeQrFromImage(file);
      if (qr?.text) setQrText(qr.text);
    } catch {
      /* not a QR code — the AI can still look at it */
    }
  }, []);

  const clearImage = (revoke = true) => {
    if (revoke && imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setQrText("");
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      setImage(file);
    }
  };

  const sensitive = scanForSecrets(text).length > 0 || detections.some((d) => SENSITIVE_IDS.has(d.id));
  const hasInput = text.trim().length > 0 || imageFile !== null;
  const canAsk = aiAvailable && hasInput && !busy && (!sensitive || secretAck);

  // Without AI the button still does something useful: the free tool finder, on any input
  const findLocally = (query = text) => {
    if (!query.trim()) return;
    setMatches(matchTools(query, 4).map((t) => t.slug));
    setSearchedLocally(true);
  };

  const updateTurn = (id: number, patch: Partial<Turn>) => setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const ask = async () => {
    if (!canAsk) return;
    const question = text.trim();
    const file = imageFile;
    const preview = imagePreview;
    const top = detections[0];
    const context = [top ? `${top.label}: ${top.summary}` : "", qrText ? `QR code text: ${qrText.slice(0, 300)}` : ""].filter(Boolean).join(" | ");
    const history = turns
      .filter((t) => t.status === "answered" && t.result)
      .flatMap((t) => [
        { role: "user" as const, text: t.question || "(an image)" },
        { role: "assistant" as const, text: t.result!.answer },
      ]);

    const id = nextId.current++;
    setTurns((prev) => [...prev, { id, question, imagePreview: preview, status: "thinking" }]);
    setTyped(0);
    setThinkingIdx(0);
    setText("");
    setSecretAck(false);
    setMatches([]);
    clearImage(false); // the preview URL now belongs to the turn

    try {
      const image = file ? await downscaleImage(file) : null;
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, image, context, history }),
      });
      const data = await res.json().catch(() => ({ ok: false, reason: "default" }));
      if (data.ok) {
        updateTurn(id, { status: "answered", result: { answer: data.answer, tools: data.tools ?? [], guides: data.guides ?? [] } });
      } else if (data.reason === "disabled") {
        // AI is switched off on this deployment: undo the turn and become the free tool finder
        setTurns((prev) => prev.filter((t) => t.id !== id));
        setAiEnabled(false);
        setText(question);
        findLocally(question);
      } else {
        updateTurn(id, { status: "failed", reason: data.reason, error: FAIL_MESSAGES[data.reason as string] ?? FAIL_MESSAGES.default });
      }
    } catch {
      updateTurn(id, { status: "failed", error: FAIL_MESSAGES.default });
    }
  };

  const submit = () => (aiAvailable ? ask() : findLocally());

  const newConversation = () => {
    turns.forEach((t) => t.imagePreview && URL.revokeObjectURL(t.imagePreview));
    setTurns([]);
    setTyped(0);
    textRef.current?.focus();
  };

  const thinkingLines = last?.imagePreview
    ? ["Thinking…", "Looking at your image…", `Checking ${tools.length} tools…`, "Putting it together…"]
    : ["Thinking…", "Reading your input…", `Checking ${tools.length} tools…`, "Putting it together…"];

  const compact = variant === "compact";

  return (
    <div className="space-y-4">
      {/* Conversation */}
      {inConversation && (
        <div className="space-y-5">
          {turns.map((t, i) => {
            const isLast = i === turns.length - 1;
            const answer = t.result?.answer ?? "";
            const shown = isLast ? answer.slice(0, typed) : answer;
            const done = !isLast || typed >= answer.length;
            return (
              <div key={t.id} ref={isLast ? lastTurnRef : undefined} className="space-y-3 scroll-mt-[calc(17vh+130px)]">
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 bg-[#a855f7]/15 border border-[#a855f7]/25 rounded-[14px] rounded-br-[4px] space-y-2">
                    {t.imagePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.imagePreview} alt="Your image" className="max-h-40 rounded-[8px] border border-[#2a2a2a]" />
                    )}
                    {t.question && <p className="text-sm text-[#f0e7ff] whitespace-pre-wrap break-words">{t.question}</p>}
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="w-full max-w-[95%] p-4 bg-[#0f0f10] border border-[#a855f7]/25 rounded-[14px] rounded-bl-[4px] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#a855f7]">
                      <Sparkles size={12} /> Ninja
                    </div>
                    {t.status === "thinking" && <ThinkingDots line={thinkingLines[thinkingIdx % thinkingLines.length]} />}
                    {t.status === "failed" && <p className="text-sm text-[#f97316]">{t.error}</p>}
                    {t.status === "failed" && (t.reason === "daily_cap" || t.reason === "budget") && (
                      <p className="text-xs text-[#888888]">
                        Ninja AI is paid for by supporters — more support means a higher daily limit.{" "}
                        <PatreonLink placement="ninja-daily-cap" className="text-[#ff8a90] hover:text-[#f5f5f5] underline">
                          Support on Patreon
                        </PatreonLink>
                      </p>
                    )}
                    {t.status === "answered" && t.result && (
                      <>
                        <div className="text-sm text-[#d4d4d4] leading-relaxed [&_code]:text-[#e879f9] [&_code]:bg-[#1a0a2e] [&_code]:px-1 [&_code]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:text-[#f5f5f5]">
                          <ReactMarkdown>{shown}</ReactMarkdown>
                        </div>
                        {done && t.result.tools.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {t.result.tools.map((tool) => (
                              <ToolChip key={tool.slug} slug={tool.slug} reason={tool.reason} />
                            ))}
                          </div>
                        )}
                        {done && t.result.guides.length > 0 && (
                          <div className="space-y-1">
                            {t.result.guides.map((slug) => (
                              <Link key={slug} href={`/blog/${slug}`} className="flex items-start gap-1.5 text-xs text-[#888888] hover:text-[#a855f7]">
                                <BookOpen size={12} className="mt-0.5 shrink-0" /> {articles.find((a) => a.slug === slug)?.title ?? slug}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-3 text-[11px] text-[#555555]">
            <span>AI can make mistakes — the linked tools give exact results.</span>
            <button onClick={newConversation} disabled={busy} className="flex shrink-0 items-center gap-1 whitespace-nowrap hover:text-[#a855f7] disabled:opacity-40 transition-colors">
              <RotateCcw size={11} /> New conversation
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (busy) return;
          const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
          if (file) setImage(file);
        }}
        className={`relative rounded-[14px] border bg-[#0d0d0f]/90 backdrop-blur transition-colors ${
          busy
            ? "border-[#222226] opacity-60"
            : dragOver
              ? "border-[#a855f7] shadow-[0_0_0_4px_rgba(168,85,247,0.15)]"
              : "border-[#2a2a2e] focus-within:border-[#a855f7]/60"
        }`}
      >
        <textarea
          ref={textRef}
          value={text}
          readOnly={busy}
          aria-disabled={busy}
          onChange={(e) => {
            setText(e.target.value);
            setSecretAck(false);
            setSearchedLocally(false);
          }}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={busy ? "Ninja is answering…" : inConversation ? "Ask a follow-up…" : PLACEHOLDERS[placeholderIdx]}
          rows={inConversation ? 2 : compact ? 3 : 6}
          spellCheck={false}
          aria-label="Paste anything or describe your problem"
          className="w-full px-4 pt-4 pb-14 bg-transparent text-[15px] text-[#f5f5f5] placeholder:text-[#555555] resize-y focus:outline-none font-mono leading-relaxed read-only:cursor-not-allowed"
        />

        <div className="absolute left-3 right-3 bottom-3 flex items-center gap-2">
          {imagePreview ? (
            <span className="flex items-center gap-2 pl-1 pr-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Attached" className="w-7 h-7 object-cover rounded" />
              <span className="text-xs text-[#888888] max-w-[140px] truncate">{imageFile?.name || "image"}</span>
              <button onClick={() => clearImage()} aria-label="Remove image" className="text-[#666666] hover:text-[#f5f5f5]">
                <X size={13} />
              </button>
            </span>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] disabled:opacity-40 transition-colors"
            >
              <ImagePlus size={13} /> Image
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImage(f);
              e.target.value = "";
            }}
          />
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-[#555555]">
            <Lock size={11} /> Detection runs in your browser
          </span>
          <button
            onClick={submit}
            disabled={aiAvailable ? !canAsk : !text.trim()}
            title="Ctrl/⌘ + Enter"
            className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 text-white rounded-[8px] transition-colors"
          >
            {aiAvailable ? (
              <>
                <Sparkles size={14} /> {thinking ? "Thinking…" : inConversation ? "Send" : "Ask Ninja AI"}
              </>
            ) : (
              <>
                <ArrowRight size={14} /> Find tools
              </>
            )}
          </button>
        </div>
      </div>

      {!busy && sensitive && aiAvailable && hasInput && (
        <label className="flex items-start gap-2 p-3 text-xs text-[#f97316] bg-[#f97316]/5 border border-[#f97316]/25 rounded-[10px] cursor-pointer">
          <input type="checkbox" checked={secretAck} onChange={(e) => setSecretAck(e.target.checked)} className="mt-0.5 accent-[#f97316]" />
          <span>
            This looks like it contains a secret (a token, key, password, or card number). The local results below never leave your
            browser — but <strong>Ask Ninja AI</strong> would send it to our AI provider. Tick to send anyway, or remove the secret first.
          </span>
        </label>
      )}

      {qrText && (
        <div className="p-3 text-xs bg-[#111111] border border-[#222222] rounded-[10px]">
          <span className="text-[#888888]">QR code in your image says: </span>
          <span className="font-mono text-[#f5f5f5] break-all">{qrText.slice(0, 400)}</span>
        </div>
      )}

      {/* Local results for what's being composed */}
      {!busy && detections.length > 0 && (
        <div className="space-y-3">
          {detections.slice(0, compact ? 1 : 3).map((d) => (
            <DetectionCard key={d.id} d={d} />
          ))}
        </div>
      )}

      {!busy && matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#666666] uppercase tracking-wider">Tools that match</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matches.map((slug) => (
              <ToolChip key={slug} slug={slug} />
            ))}
          </div>
        </div>
      )}

      {!inConversation && source && !detections.length && !matches.length && (
        <p className="text-xs text-[#666666]">
          {aiAvailable
            ? "Not sure what this is — ask Ninja AI for a closer look."
            : searchedLocally
              ? "No tool matched that. Describe the task (e.g. “decode a JWT”, “convert CSV to JSON”) or paste the data itself — a token, an error, a timestamp."
              : "Paste data to identify it instantly, or describe a task and press Find tools."}
        </p>
      )}
    </div>
  );
}
