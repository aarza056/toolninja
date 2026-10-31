// Content for the /tools/barcode-generator/<type> pages, one per symbology people search for
// ("ean-13 barcode generator", "code 128 barcode generator", "upc-a barcode generator").
import type { BarcodeFormat } from "@/lib/barcode";

export interface BarcodePage {
  slug: string;
  format: BarcodeFormat;
  name: string;
  facts: [string, string][];
  usedFor: string;
  notes: string[];
  faq: { q: string; a: string }[];
}

export const BARCODE_PAGES: BarcodePage[] = [
  {
    slug: "ean-13",
    format: "ean13",
    name: "EAN-13",
    facts: [
      ["Encodes", "13 digits: GS1 company prefix, item number, check digit"],
      ["Check digit", "Mod 10, weights 1 and 3 — added automatically from 12 digits"],
      ["Used on", "Retail products worldwide (outside North America especially)"],
      ["Also called", "GTIN-13, International Article Number"],
    ],
    usedFor: "EAN-13 is the barcode on almost every retail product sold outside North America. Shops scan it at checkout to look the product up in their database.",
    notes: [
      "The first digits are the GS1 prefix of the organization that issued the company number — not the country the product was made in.",
      "To sell in stores you need numbers licensed from GS1; a made-up EAN-13 may collide with someone else's product.",
      "Print at 80–200% of the nominal size and keep the light margins on both sides, or scanners may fail to read it.",
    ],
    faq: [
      { q: "How is the EAN-13 check digit calculated?", a: "Multiply the first 12 digits alternately by 1 and 3 (starting with 1), add the results, and take the amount needed to reach the next multiple of 10. Type 12 digits here and the tool adds it for you." },
      { q: "Can I make up my own EAN-13 numbers?", a: "For internal use, yes. For products sold through retailers or marketplaces, get numbers from GS1 — retailers check that the company prefix belongs to you." },
    ],
  },
  {
    slug: "upc-a",
    format: "upca",
    name: "UPC-A",
    facts: [
      ["Encodes", "12 digits: number system, company prefix, item number, check digit"],
      ["Check digit", "Mod 10, weights 3 and 1 — added automatically from 11 digits"],
      ["Used on", "Retail products in the US and Canada"],
      ["Relation to EAN-13", "A UPC-A is an EAN-13 that starts with 0"],
    ],
    usedFor: "UPC-A is the standard retail barcode in the United States and Canada. Every store scanner reads it, and scanners worldwide accept it too.",
    notes: [
      "A UPC-A and the EAN-13 with a leading 0 produce exactly the same bars.",
      "Like EAN-13, real product numbers come from GS1 US (or your local GS1).",
      "Amazon and most retailers verify the GS1 company prefix, so generated numbers only suit internal use.",
    ],
    faq: [
      { q: "What's the difference between UPC and EAN?", a: "UPC-A has 12 digits and is used mainly in North America; EAN-13 has 13 and is used everywhere else. A UPC-A is just an EAN-13 with a leading zero, and modern scanners read both." },
      { q: "How do I calculate a UPC check digit?", a: "Add the digits in odd positions and multiply by 3, add the digits in even positions, then take what's needed to reach the next multiple of 10. Enter 11 digits and the generator does it." },
    ],
  },
  {
    slug: "ean-8",
    format: "ean8",
    name: "EAN-8",
    facts: [
      ["Encodes", "8 digits including the check digit"],
      ["Check digit", "Mod 10, weights 3 and 1 — added automatically from 7 digits"],
      ["Used on", "Small packages where an EAN-13 doesn't fit (gum, cosmetics)"],
      ["Also called", "GTIN-8"],
    ],
    usedFor: "EAN-8 is the short version of EAN-13 for products too small to fit a full barcode, such as chewing gum or lipstick.",
    notes: [
      "GS1 issues EAN-8 numbers individually and only when a product is genuinely too small for an EAN-13.",
      "It has 4 digits on each side of the centre guard bars and no hidden first digit, unlike EAN-13.",
    ],
    faq: [
      { q: "When should I use EAN-8 instead of EAN-13?", a: "Only when the package is too small for an EAN-13 even after reducing its size. GS1 assigns EAN-8 numbers one by one for that case." },
      { q: "Is EAN-8 the same as the first 8 digits of an EAN-13?", a: "No. An EAN-8 is its own 8-digit number with its own check digit; you can't shorten an EAN-13 into one." },
    ],
  },
  {
    slug: "code-128",
    format: "code128",
    name: "Code 128",
    facts: [
      ["Encodes", "Any printable ASCII text: letters, digits, punctuation"],
      ["Check character", "Mod 103 — always added automatically, not printed"],
      ["Used on", "Shipping labels, logistics, inventory, GS1-128"],
      ["Density", "High — shorter than Code 39 for the same text"],
    ],
    usedFor: "Code 128 is the general-purpose barcode for text and IDs: shipping labels, warehouse locations, asset tags and serial numbers.",
    notes: [
      "This generator uses Code Set B, which covers all printable ASCII characters.",
      "GS1-128 (formerly UCC/EAN-128) is Code 128 with a special start character and Application Identifiers like (01) for GTIN.",
      "The hidden check character makes misreads very unlikely, so no extra check digit is needed.",
    ],
    faq: [
      { q: "Code 128 or Code 39 — which should I use?", a: "Code 128 for anything new: it encodes lowercase and punctuation and is much more compact. Use Code 39 only when a system or industry standard requires it." },
      { q: "Can Code 128 encode numbers only?", a: "Yes. Code 128 can pack digits in pairs (Code Set C) for an even shorter barcode; this generator uses Set B, which works for any text including numbers." },
    ],
  },
  {
    slug: "code-39",
    format: "code39",
    name: "Code 39",
    facts: [
      ["Encodes", "A–Z, 0–9 and - . space $ / + %"],
      ["Check digit", "Optional (mod 43); none is added here"],
      ["Used on", "Automotive (AIAG), US defense (LOGMARS), ID badges, older industrial systems"],
      ["Start / stop", "An asterisk * on each end, shown in the text below the bars"],
    ],
    usedFor: "Code 39 is an older, self-checking barcode still required in automotive, defense and many industrial and badge systems.",
    notes: [
      "Every character is self-checking (exactly 3 of its 9 elements are wide), so it works without a check digit.",
      "Lowercase letters aren't part of standard Code 39 — the generator uppercases them.",
      "It's wider than Code 128 for the same text; leave room for the quiet zones on both ends.",
    ],
    faq: [
      { q: "Why are there asterisks around Code 39 text?", a: "The * is Code 39's start and stop character. Scanners need it to find the barcode, and it's usually printed in the text line too." },
      { q: "Does Code 39 support lowercase?", a: "Not in the standard character set. Full ASCII Code 39 encodes lowercase as two-character pairs, but the scanner must be set to that mode; for mixed-case text use Code 128 instead." },
    ],
  },
  {
    slug: "itf-14",
    format: "itf14",
    name: "ITF-14",
    facts: [
      ["Encodes", "14 digits (GTIN-14): packaging indicator, GTIN, check digit"],
      ["Check digit", "Mod 10, weights 3 and 1 — added automatically from 13 digits"],
      ["Used on", "Outer cartons and cases in warehouses and distribution"],
      ["Symbology", "Interleaved 2 of 5"],
    ],
    usedFor: "ITF-14 marks shipping cartons and cases. It survives printing straight onto corrugated cardboard, where finer barcodes smudge.",
    notes: [
      "The first digit is the packaging indicator (1–8) that distinguishes a case of 6 from a case of 12 of the same product.",
      "To build one from an EAN-13: indicator digit + the first 12 digits of the EAN-13, then a new check digit.",
      "On cardboard, ITF-14 is usually printed with a thick bearer bar frame so a partial scan can't misread it.",
    ],
    faq: [
      { q: "How do I create an ITF-14 from my EAN-13?", a: "Put a packaging indicator digit (1–8) in front of the first 12 digits of the EAN-13 (dropping its check digit) and enter those 13 digits here — the new check digit is calculated for you." },
      { q: "What are the bars around an ITF-14 barcode?", a: "Bearer bars. They stop a scanner from reading only part of the barcode as a shorter valid code, which Interleaved 2 of 5 is prone to on rough print." },
    ],
  },
];
