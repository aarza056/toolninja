// Text out of the files people drop on the AI Token Counter, read entirely in the browser:
//   - PDF: pdf.js, loaded from our own /vendor folder only when a PDF is opened
//   - Word (.docx), PowerPoint (.pptx), OpenDocument (.odt): unzipped with the browser's
//     DecompressionStream and the text read out of their XML
//   - anything text-like: read as UTF-8

export interface ExtractedFile {
  name: string;
  kind: "pdf" | "docx" | "pptx" | "odt" | "text";
  text: string;
  pages?: number;
  note?: string;
}

const PDFJS_VERSION = "4.10.38";
const PDFJS_BASE = `/vendor/pdfjs-${PDFJS_VERSION}`;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

// ── ZIP ───────────────────────────────────────────────────────────────────

export interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
}

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + ((b[o + 3] << 24) >>> 0);

/** The entries listed in a ZIP's central directory */
export function zipEntries(b: Uint8Array): ZipEntry[] {
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (u32(b, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This file isn't a valid ZIP-based document.");
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const out: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count && p + 46 <= b.length; i++) {
    if (u32(b, p) !== 0x02014b50) break;
    const method = u16(b, p + 10);
    const compressedSize = u32(b, p + 20);
    const nameLen = u16(b, p + 28);
    const extraLen = u16(b, p + 30);
    const commentLen = u16(b, p + 32);
    const localOffset = u32(b, p + 42);
    out.push({ name: dec.decode(b.subarray(p + 46, p + 46 + nameLen)), method, compressedSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipEntry(b: Uint8Array, e: ZipEntry): Promise<Uint8Array> {
  const start = e.localOffset + 30 + u16(b, e.localOffset + 26) + u16(b, e.localOffset + 28);
  const data = b.subarray(start, start + e.compressedSize);
  if (e.method === 0) return data;
  if (e.method === 8) return inflateRaw(data);
  throw new Error(`Unsupported compression in ${e.name}.`);
}

// ── Office XML ────────────────────────────────────────────────────────────

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

/** Word's document.xml (and headers, footnotes) to plain text: paragraphs on their own lines */
export function wordXmlToText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:(br|cr)\b[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:delText[^>]*>[\s\S]*?<\/w:delText>/g, "")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A PowerPoint slide's text runs, one paragraph per line */
export function slideXmlToText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<a:br\b[^>]*\/>/g, "\n")
      .replace(/<\/a:p>/g, "\n")
      .replace(/<(?!\/?a:t\b)[^>]+>/g, "")
      .replace(/<\/?a:t\b[^>]*>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** OpenDocument content.xml to text */
export function odtXmlToText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<text:tab\/>/g, "\t")
      .replace(/<text:line-break\/>/g, "\n")
      .replace(/<text:s(?: text:c="(\d+)")?\/>/g, (_, n) => " ".repeat(Number(n ?? 1)))
      .replace(/<\/text:(p|h)>/g, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

const dec = new TextDecoder("utf-8");

async function officeText(b: Uint8Array, kind: "docx" | "pptx" | "odt"): Promise<{ text: string; pages?: number }> {
  const entries = zipEntries(b);
  const get = async (name: string) => {
    const e = entries.find((x) => x.name === name);
    return e ? dec.decode(await readZipEntry(b, e)) : null;
  };
  if (kind === "docx") {
    const main = await get("word/document.xml");
    if (main === null) throw new Error("No word/document.xml inside: is this a Word document?");
    const extras = entries.filter((e) => /^word\/(footnotes|endnotes|header\d*|footer\d*)\.xml$/.test(e.name));
    const parts = [wordXmlToText(main)];
    for (const e of extras) {
      const t = wordXmlToText(dec.decode(await readZipEntry(b, e)));
      if (t) parts.push(t);
    }
    return { text: parts.join("\n\n") };
  }
  if (kind === "pptx") {
    const slides = entries
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
      .sort((a, c) => Number(/(\d+)\.xml$/.exec(a.name)![1]) - Number(/(\d+)\.xml$/.exec(c.name)![1]));
    if (!slides.length) throw new Error("No slides inside: is this a PowerPoint file?");
    const notes = entries.filter((e) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(e.name));
    const parts: string[] = [];
    for (const e of slides.concat(notes)) {
      const t = slideXmlToText(dec.decode(await readZipEntry(b, e)));
      if (t) parts.push(t);
    }
    return { text: parts.join("\n\n"), pages: slides.length };
  }
  const content = await get("content.xml");
  if (content === null) throw new Error("No content.xml inside: is this an OpenDocument file?");
  return { text: odtXmlToText(content) };
}

// ── PDF ───────────────────────────────────────────────────────────────────

interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
}

interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: Uint8Array; isEvalSupported: boolean; disableFontFace: boolean; verbosity: number }) => {
    promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: PdfTextItem[] }> }>; destroy: () => Promise<void> }>;
  };
}

let pdfjs: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjs) {
    const url = `${PDFJS_BASE}/pdf.min.js`;
    pdfjs = (import(/* webpackIgnore: true */ url) as Promise<PdfJs>).then((m) => {
      m.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
      return m;
    });
    pdfjs.catch(() => {
      pdfjs = null;
    });
  }
  return pdfjs;
}

async function pdfText(b: Uint8Array, onProgress?: (done: number, total: number) => void): Promise<{ text: string; pages: number }> {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: b, isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise;
  const pages: string[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(content.items.map((i) => (i.str ?? "") + (i.hasEOL ? "\n" : "")).join(""));
      onProgress?.(n, doc.numPages);
    }
  } finally {
    await doc.destroy();
  }
  return { text: pages.join("\n\n").replace(/[ \t]+\n/g, "\n").trim(), pages: doc.numPages };
}

// ── Entry point ───────────────────────────────────────────────────────────

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|jsonl|ndjson|xml|html?|css|scss|js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|kt|swift|c|h|cc|cpp|hpp|cs|php|sql|sh|bash|zsh|ps1|ya?ml|toml|ini|cfg|conf|env|log|tex|rst|srt|vtt|svg|graphql|proto|vue|svelte|dart|lua|r|scala|ex|exs|erl|clj|hs|pl|m|ipynb)$/i;

export function kindOf(file: { name: string; type: string }): ExtractedFile["kind"] | null {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (n.endsWith(".docx")) return "docx";
  if (n.endsWith(".pptx")) return "pptx";
  if (n.endsWith(".odt") || n.endsWith(".odp")) return "odt";
  if (TEXT_EXT.test(n) || file.type.startsWith("text/") || /json|xml|javascript/.test(file.type)) return "text";
  return null;
}

export async function extractText(file: File, onProgress?: (done: number, total: number) => void): Promise<ExtractedFile> {
  const kind = kindOf(file);
  if (!kind) throw new Error(`${file.name}: this file type isn't supported. Use PDF, Word (.docx), PowerPoint (.pptx), OpenDocument or a text file.`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 50 MB.`);
  if (kind === "text") {
    let text = await file.text();
    if (/\.html?$/i.test(file.name)) text = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
    return { name: file.name, kind, text };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (kind === "pdf") {
    const { text, pages } = await pdfText(bytes, onProgress);
    const note = !text.replace(/\s/g, "") ? "No text found. This is probably a scanned PDF: its pages are images, which a model reads (and bills) as images rather than text." : undefined;
    return { name: file.name, kind, text, pages, note };
  }
  const { text, pages } = await officeText(bytes, kind);
  return { name: file.name, kind, text, pages };
}
