"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ImagePlus, X, Sparkles, ShieldAlert, ArrowRight, BookOpen, Lock } from "lucide-react";
import { tools } from "@/lib/tools";
import { detectLocal, looksLikeQuestion, type Detection } from "@/lib/detect";
import { matchTools } from "@/lib/tool-match";
import { scanForSecrets } from "@/lib/secret-scanner";
import { decodeQrFromImage } from "@/lib/qr-decode";
import type { ErrorArticleIndex } from "@/lib/error-matcher";
import type { CloudMode } from "./ParticleCloud";

interface AiResult {
  answer: string;
  tools: { slug: string; reason: string }[];
  guides: string[];
}

type AiState = "idle" | "thinking" | "answered" | "failed";

const PLACEHOLDERS = [
  "Paste a JWT, a cron expression, a certificate, a cURL command…",
  "…or an error message from your terminal",
  "…or describe your problem: “convert my docker run command to compose”",
];

const FAIL_MESSAGES: Record<string, string> = {
  rate_limited: "You've asked a lot in a short time — try again in a few minutes. Meanwhile, here's what I found locally.",
  daily_cap: "Ninja AI has hit its daily limit. It'll be back tomorrow — the local results below still work.",
  disabled: "Ninja AI isn't switched on right now. The local results below still work.",
  refusal: "I can't help with that one. Try rephrasing it as a developer question.",
  image_too_large: "That image is too large — try a smaller screenshot.",
  default: "Ninja AI is unavailable right now. The local results below still work.",
};

const SENSITIVE_IDS = new Set(["jwt", "pem-key", "otpauth", "connection-string", "card"]);

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
  const [articles, setArticles] = useState<ErrorArticleIndex[]>([]);
  // null = not known yet; assume available so the button never flickers from "Find tools" to "Ask"
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const aiAvailable = aiEnabled !== false;
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [typed, setTyped] = useState(0);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [secretAck, setSecretAck] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

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

  // Local analysis: runs on every edit (debounced), entirely in the browser
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
      setMatches(!strong && looksLikeQuestion(source) ? matchTools(source, 4).map((t) => t.slug) : []);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [source, articles]);

  // Cloud mode follows the AI state
  useEffect(() => {
    if (aiState === "thinking") onCloudMode?.("thinking");
    else if (aiState === "answered" && aiResult && typed < aiResult.answer.length) onCloudMode?.("speaking");
    else onCloudMode?.("idle");
  }, [aiState, aiResult, typed, onCloudMode]);

  useEffect(() => {
    if (aiState !== "thinking") return;
    const id = setInterval(() => setThinkingIdx((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [aiState]);

  // Typewriter reveal of the AI answer
  useEffect(() => {
    if (aiState !== "answered" || !aiResult || typed >= aiResult.answer.length) return;
    // ~90 chars/s: readable, and long enough for the cloud's "speaking" pulse to register
    const id = setTimeout(() => setTyped((n) => Math.min(n + 2, aiResult.answer.length)), 22);
    return () => clearTimeout(id);
  }, [aiState, aiResult, typed]);

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

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
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

  const sensitive =
    scanForSecrets(text).length > 0 || detections.some((d) => SENSITIVE_IDS.has(d.id));
  const hasInput = text.trim().length > 0 || imageFile !== null;
  const canAsk = aiAvailable && hasInput && aiState !== "thinking" && (!sensitive || secretAck);
  const [searchedLocally, setSearchedLocally] = useState(false);

  // Without AI the button still does something useful: the free tool finder, on any input
  const findLocally = () => {
    if (!text.trim()) return;
    setMatches(matchTools(text, 4).map((t) => t.slug));
    setSearchedLocally(true);
  };

  const submit = () => (aiAvailable ? ask() : findLocally());

  const ask = async () => {
    if (!canAsk) return;
    setAiState("thinking");
    setAiResult(null);
    setAiError("");
    setTyped(0);
    setThinkingIdx(0);
    try {
      const image = imageFile ? await downscaleImage(imageFile) : null;
      const top = detections[0];
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text.trim(),
          image,
          context: top ? `${top.label}: ${top.summary}${qrText ? ` | QR code text: ${qrText.slice(0, 300)}` : ""}` : qrText ? `QR code text: ${qrText.slice(0, 300)}` : "",
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, reason: "default" }));
      if (data.ok) {
        setAiResult({ answer: data.answer, tools: data.tools ?? [], guides: data.guides ?? [] });
        setAiState("answered");
      } else if (data.reason === "disabled") {
        // AI is switched off on this deployment: quietly become the free tool finder
        setAiEnabled(false);
        setAiState("idle");
        findLocally();
      } else {
        setAiError(FAIL_MESSAGES[data.reason as string] ?? FAIL_MESSAGES.default);
        setAiState("failed");
        if (!matches.length && text.trim()) setMatches(matchTools(text, 4).map((t) => t.slug));
      }
    } catch {
      setAiError(FAIL_MESSAGES.default);
      setAiState("failed");
    }
  };

  const thinkingLines = imageFile
    ? ["Thinking…", "Looking at your image…", `Checking ${tools.length} tools…`, "Putting it together…"]
    : ["Thinking…", "Reading your input…", `Checking ${tools.length} tools…`, "Putting it together…"];

  const compact = variant === "compact";

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
          if (file) setImage(file);
        }}
        className={`relative rounded-[14px] border bg-[#0d0d0f]/90 backdrop-blur transition-colors ${
          dragOver ? "border-[#a855f7] shadow-[0_0_0_4px_rgba(168,85,247,0.15)]" : "border-[#2a2a2e] focus-within:border-[#a855f7]/60"
        }`}
      >
        <textarea
          ref={textRef}
          value={text}
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
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={compact ? 3 : 6}
          spellCheck={false}
          aria-label="Paste anything or describe your problem"
          className="w-full px-4 pt-4 pb-14 bg-transparent text-[15px] text-[#f5f5f5] placeholder:text-[#555555] resize-y focus:outline-none font-mono leading-relaxed"
        />

        <div className="absolute left-3 right-3 bottom-3 flex items-center gap-2">
          {imagePreview ? (
            <span className="flex items-center gap-2 pl-1 pr-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Attached" className="w-7 h-7 object-cover rounded" />
              <span className="text-xs text-[#888888] max-w-[140px] truncate">{imageFile?.name || "image"}</span>
              <button onClick={clearImage} aria-label="Remove image" className="text-[#666666] hover:text-[#f5f5f5]">
                <X size={13} />
              </button>
            </span>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] transition-colors"
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
                <Sparkles size={14} /> {aiState === "thinking" ? "Thinking…" : "Ask Ninja AI"}
              </>
            ) : (
              <>
                <ArrowRight size={14} /> Find tools
              </>
            )}
          </button>
        </div>
      </div>

      {sensitive && aiAvailable && (text.trim() || imageFile) && (
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

      {/* AI answer */}
      {aiState === "thinking" && (
        <div className="flex items-center gap-3 p-4 bg-[#0f0f10] border border-[#a855f7]/25 rounded-[10px]">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
          <span className="text-sm text-[#c4a5f7]">{thinkingLines[thinkingIdx % thinkingLines.length]}</span>
        </div>
      )}

      {aiState === "answered" && aiResult && (
        <div className="p-4 bg-[#0f0f10] border border-[#a855f7]/30 rounded-[10px] space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-[#a855f7]">
            <Sparkles size={12} /> Ninja AI
          </div>
          <div className="text-sm text-[#d4d4d4] leading-relaxed [&_code]:text-[#e879f9] [&_code]:bg-[#1a0a2e] [&_code]:px-1 [&_code]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2 [&_strong]:text-[#f5f5f5]">
            <ReactMarkdown>{aiResult.answer.slice(0, typed)}</ReactMarkdown>
          </div>
          {typed >= aiResult.answer.length && (
            <>
              {aiResult.tools.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiResult.tools.map((t) => (
                    <ToolChip key={t.slug} slug={t.slug} reason={t.reason} />
                  ))}
                </div>
              )}
              {aiResult.guides.length > 0 && (
                <div className="space-y-1">
                  {aiResult.guides.map((slug) => {
                    const g = articles.find((a) => a.slug === slug);
                    return (
                      <Link key={slug} href={`/blog/${slug}`} className="flex items-start gap-1.5 text-xs text-[#888888] hover:text-[#a855f7]">
                        <BookOpen size={12} className="mt-0.5 shrink-0" /> {g?.title ?? slug}
                      </Link>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[#555555]">AI can make mistakes — the linked tools give exact results.</p>
            </>
          )}
        </div>
      )}

      {aiState === "failed" && aiError && <p className="text-xs text-[#f97316]">{aiError}</p>}

      {/* Local results */}
      {detections.length > 0 && (
        <div className="space-y-3">
          {detections.slice(0, compact ? 1 : 3).map((d) => (
            <DetectionCard key={d.id} d={d} />
          ))}
        </div>
      )}

      {matches.length > 0 && aiState !== "answered" && (
        <div className="space-y-2">
          <p className="text-xs text-[#666666] uppercase tracking-wider">Tools that match</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matches.map((slug) => (
              <ToolChip key={slug} slug={slug} />
            ))}
          </div>
        </div>
      )}

      {source && !detections.length && !matches.length && aiState === "idle" && (
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
