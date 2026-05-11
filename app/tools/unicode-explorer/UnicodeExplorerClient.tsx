"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface CharInfo {
  codePoint: number;
  char: string;
  name: string;
  block: string;
  htmlEntity: string;
  utf8: string;
  escaped: string;
}

// ─── Curated dataset ─────────────────────────────────────────────────────────
const RAW_CHARS = [
  // Common symbols
  "©","®","™","°","±","×","÷","∞","≈","≠","≤","≥","∑","∏","√","∫","∂","∇","∀","∃","∅",
  // Arrows
  "→","←","↑","↓","↔","↖","↗","↘","↙","⇒","⇐","⇑","⇓","⇔","↩","↪",
  // Math
  "∈","∉","∪","∩","⊂","⊃","⊄","⊅","∧","∨","⊕","⊗","∄","±","∓","≡","≢","∝","∞",
  // Currency
  "€","£","¥","₹","₽","₿","¢","₩","₪","₺",
  // Punctuation / typography
  "…","—","–","«","»","‹","›","·","†","‡","§","¶","°",
  // Geometric
  "■","□","▪","▫","●","○","◆","◇","▲","▼","★","☆","♦","▸","▾","◀","▶",
  // Miscellaneous
  "✓","✗","✘","✔","✕","☑","☐","✉","☎","☔","☀","☁","❄","⚡","♻","✈","⚙","⚠",
  // Greek lowercase
  "α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","σ","τ","υ","φ","χ","ψ","ω",
  // Greek uppercase
  "Α","Β","Γ","Δ","Ε","Ζ","Η","Θ","Ι","Κ","Λ","Μ","Ν","Ξ","Ο","Π","Ρ","Σ","Τ","Υ","Φ","Χ","Ψ","Ω",
  // Emoji
  "😀","😂","❤","🔥","💯","⭐","🎉","🚀","💡","🔍","👋","💻","🛠","📦","🐛",
  // Superscript/subscript
  "¹","²","³","⁴","½","¼","¾","⅓","⅔",
  // Special spaces & invisible
  " ","​"," "," ",
];

const NAMES: Record<number, string> = {
  169:"Copyright Sign",170:"Feminine Ordinal Indicator",174:"Registered Sign",176:"Degree Sign",177:"Plus-Minus Sign",
  215:"Multiplication Sign",247:"Division Sign",8734:"Infinity",8776:"Almost Equal To",8800:"Not Equal To",
  8804:"Less-Than Or Equal To",8805:"Greater-Than Or Equal To",8721:"N-Ary Summation",8719:"N-Ary Product",
  8730:"Square Root",8747:"Integral",8706:"Partial Differential",8711:"Nabla",8704:"For All",8707:"There Exists",
  8709:"Empty Set",8712:"Element Of",8713:"Not An Element Of",8746:"Union",8745:"Intersection",
  8834:"Subset Of",8835:"Superset Of",8836:"Not A Subset Of",8837:"Not A Superset Of",
  8743:"Logical And",8744:"Logical Or",8853:"Circled Plus",8855:"Circled Times",8708:"There Does Not Exist",
  8723:"Minus-Or-Plus Sign",8803:"Strictly Equivalent To",8802:"Not Identical To",8733:"Proportional To",
  8735:"Right Angle",
  8594:"Rightwards Arrow",8592:"Leftwards Arrow",8593:"Upwards Arrow",8595:"Downwards Arrow",
  8596:"Left Right Arrow",8598:"North West Arrow",8599:"North East Arrow",8600:"South East Arrow",
  8601:"South West Arrow",8658:"Rightwards Double Arrow",8656:"Leftwards Double Arrow",
  8657:"Upwards Double Arrow",8659:"Downwards Double Arrow",8660:"Left Right Double Arrow",
  8617:"Leftwards Arrow With Hook",8618:"Rightwards Arrow With Hook",
  8364:"Euro Sign",163:"Pound Sign",165:"Yen Sign",8377:"Indian Rupee Sign",8381:"Ruble Sign",
  8383:"Bitcoin Sign",162:"Cent Sign",8361:"Won Sign",8362:"New Sheqel Sign",8378:"Turkish Lira Sign",
  8230:"Horizontal Ellipsis",8212:"Em Dash",8211:"En Dash",8216:"Left Single Quotation Mark",
  8217:"Right Single Quotation Mark",8220:"Left Double Quotation Mark",8221:"Right Double Quotation Mark",
  171:"Left-Pointing Double Angle Quotation Mark",187:"Right-Pointing Double Angle Quotation Mark",
  8249:"Single Left-Pointing Angle Quotation Mark",8250:"Single Right-Pointing Angle Quotation Mark",
  183:"Middle Dot",8224:"Dagger",8225:"Double Dagger",167:"Section Sign",182:"Pilcrow Sign",
  9632:"Black Square",9633:"White Square",9642:"Black Small Square",9643:"White Small Square",
  9679:"Black Circle",9675:"White Circle",9670:"Black Diamond",9671:"White Diamond",9650:"Black Up-Pointing Triangle",
  9660:"Black Down-Pointing Triangle",9733:"Black Star",9734:"White Star",9830:"Black Diamond Suit",
  9656:"Black Right-Pointing Small Triangle",9662:"Black Down-Pointing Small Triangle",
  9664:"Black Left-Pointing Small Triangle",9654:"Black Right-Pointing Small Triangle",
  10003:"Check Mark",10007:"Ballot X",10008:"Heavy Ballot X",10004:"Heavy Check Mark",10005:"Heavy Multiplication X",
  9745:"Ballot Box With Check",9744:"Ballot Box",9993:"Envelope",9742:"Black Telephone",9748:"Umbrella With Rain Drops",
  9728:"Black Sun With Rays",9729:"Cloud",10052:"Snowflake",9889:"High Voltage Sign",9851:"Black Universal Recycling Symbol",
  9992:"Airplane",9881:"Gear",9888:"Warning Sign",
  945:"Greek Small Letter Alpha",946:"Greek Small Letter Beta",947:"Greek Small Letter Gamma",
  948:"Greek Small Letter Delta",949:"Greek Small Letter Epsilon",950:"Greek Small Letter Zeta",
  951:"Greek Small Letter Eta",952:"Greek Small Letter Theta",953:"Greek Small Letter Iota",
  954:"Greek Small Letter Kappa",955:"Greek Small Letter Lambda",956:"Greek Small Letter Mu",
  957:"Greek Small Letter Nu",958:"Greek Small Letter Xi",959:"Greek Small Letter Omicron",
  960:"Greek Small Letter Pi",961:"Greek Small Letter Rho",963:"Greek Small Letter Sigma",
  964:"Greek Small Letter Tau",965:"Greek Small Letter Upsilon",966:"Greek Small Letter Phi",
  967:"Greek Small Letter Chi",968:"Greek Small Letter Psi",969:"Greek Small Letter Omega",
  913:"Greek Capital Letter Alpha",914:"Greek Capital Letter Beta",915:"Greek Capital Letter Gamma",
  916:"Greek Capital Letter Delta",917:"Greek Capital Letter Epsilon",918:"Greek Capital Letter Zeta",
  919:"Greek Capital Letter Eta",920:"Greek Capital Letter Theta",921:"Greek Capital Letter Iota",
  922:"Greek Capital Letter Kappa",923:"Greek Capital Letter Lambda",924:"Greek Capital Letter Mu",
  925:"Greek Capital Letter Nu",926:"Greek Capital Letter Xi",927:"Greek Capital Letter Omicron",
  928:"Greek Capital Letter Pi",929:"Greek Capital Letter Rho",931:"Greek Capital Letter Sigma",
  932:"Greek Capital Letter Tau",933:"Greek Capital Letter Upsilon",934:"Greek Capital Letter Phi",
  935:"Greek Capital Letter Chi",936:"Greek Capital Letter Psi",937:"Greek Capital Letter Omega",
  128512:"Grinning Face",128514:"Face With Tears Of Joy",10084:"Heavy Black Heart",128293:"Fire",
  128175:"Hundred Points Symbol",11088:"White Medium Star",127881:"Party Popper",128640:"Rocket",
  128161:"Electric Light Bulb",128269:"Left-Pointing Magnifying Glass",128075:"Waving Hand Sign",
  128187:"Personal Computer",128288:"Black Scissors",128294:"Package",128027:"Bug",
  185:"Superscript One",178:"Superscript Two",179:"Superscript Three",8308:"Superscript Four",
  189:"Vulgar Fraction One Half",188:"Vulgar Fraction One Quarter",190:"Vulgar Fraction Three Quarters",
  8531:"Vulgar Fraction One Third",8532:"Vulgar Fraction Two Thirds",
  160:"No-Break Space",8203:"Zero Width Space",8232:"Line Separator",8233:"Paragraph Separator",
  8482:"Trade Mark Sign",
};

function getUnicodeBlock(cp: number): string {
  if (cp < 128) return "Basic Latin";
  if (cp < 256) return "Latin-1 Supplement";
  if (cp < 592) return "Latin Extended";
  if (cp < 688) return "IPA Extensions";
  if (cp < 880) return "Spacing Modifier Letters";
  if (cp < 1024) return "Greek and Coptic";
  if (cp < 1280) return "Cyrillic";
  if (cp < 1536) return "Armenian / Hebrew";
  if (cp < 1792) return "Arabic";
  if (cp < 8192) return "Miscellaneous";
  if (cp < 8304) return "General Punctuation";
  if (cp < 8352) return "Superscripts and Subscripts";
  if (cp < 8400) return "Currency Symbols";
  if (cp < 8592) return "Letterlike Symbols";
  if (cp < 8704) return "Arrows";
  if (cp < 8960) return "Mathematical Operators";
  if (cp < 9216) return "Miscellaneous Technical";
  if (cp < 9472) return "Control Pictures";
  if (cp < 9600) return "Box Drawing";
  if (cp < 9632) return "Block Elements";
  if (cp < 9728) return "Geometric Shapes";
  if (cp < 9984) return "Miscellaneous Symbols";
  if (cp < 10176) return "Dingbats";
  if (cp < 11264) return "Miscellaneous Mathematical";
  if (cp >= 127744 && cp < 128512) return "Miscellaneous Symbols and Pictographs";
  if (cp >= 128512 && cp < 128592) return "Emoticons";
  if (cp >= 128640 && cp < 128768) return "Transport and Map Symbols";
  return "Other";
}

function charToUtf8Hex(cp: number): string {
  const bytes: number[] = [];
  if (cp < 0x80) {
    bytes.push(cp);
  } else if (cp < 0x800) {
    bytes.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
  } else if (cp < 0x10000) {
    bytes.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
  } else {
    bytes.push(
      0xF0 | (cp >> 18),
      0x80 | ((cp >> 12) & 0x3F),
      0x80 | ((cp >> 6) & 0x3F),
      0x80 | (cp & 0x3F)
    );
  }
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function getCharInfo(char: string): CharInfo {
  const cp = char.codePointAt(0) ?? 0;
  const hexCp = cp.toString(16).toUpperCase().padStart(4, "0");
  return {
    codePoint: cp,
    char,
    name: NAMES[cp] ?? `U+${hexCp}`,
    block: getUnicodeBlock(cp),
    htmlEntity: `&#x${hexCp};`,
    utf8: charToUtf8Hex(cp),
    escaped: cp > 0xFFFF ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, "0")}`,
  };
}

const DATASET: CharInfo[] = RAW_CHARS.map((c) => getCharInfo(c));

function searchDataset(query: string): CharInfo[] {
  if (!query) return DATASET.slice(0, 50);
  const q = query.trim();

  // U+XXXX or u+XXXX
  if (/^[uU]\+[0-9a-fA-F]+$/.test(q)) {
    const cp = parseInt(q.slice(2), 16);
    const char = String.fromCodePoint(cp);
    return [getCharInfo(char)];
  }

  // Pure decimal code point (4-6 digits)
  if (/^\d{4,7}$/.test(q)) {
    const cp = parseInt(q, 10);
    if (cp >= 0 && cp <= 0x10FFFF) {
      const char = String.fromCodePoint(cp);
      return [getCharInfo(char)];
    }
  }

  // 1-2 characters typed directly
  const cps = Array.from(q).slice(0, 2);
  if (cps.length <= 2 && q.length <= 4) {
    return cps.map((c) => getCharInfo(c));
  }

  // Name search
  const lower = q.toLowerCase();
  return DATASET.filter(
    (c) => c.name.toLowerCase().includes(lower) || c.block.toLowerCase().includes(lower)
  ).slice(0, 50);
}

// ─── Detail card ─────────────────────────────────────────────────────────────
function DetailCard({ info }: { info: CharInfo }) {
  const hex = info.codePoint.toString(16).toUpperCase().padStart(4, "0");
  const props = [
    { label: "Code Point", value: `U+${hex}` },
    { label: "Decimal", value: String(info.codePoint) },
    { label: "Block", value: info.block },
    { label: "UTF-8 Bytes", value: info.utf8 },
    { label: "HTML Entity", value: info.htmlEntity },
    { label: "JS Escape", value: info.escaped },
    { label: "Name", value: info.name },
  ];
  return (
    <div className="border border-[#222222] rounded-[8px] overflow-hidden mb-4">
      <div className="flex items-center justify-center p-8 bg-[#0d0d0d] border-b border-[#222222]">
        <span className="text-7xl leading-none select-all" style={{ fontFamily: "system-ui, serif" }}>
          {info.char}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a]">
        {props.map(({ label, value }) => (
          <div key={label} className="bg-[#111111] p-3 flex flex-col gap-1">
            <span className="text-[10px] text-[#555555] uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-[#f5f5f5] break-all">{value}</span>
              <CopyButton text={value} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UnicodeExplorerClient() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CharInfo | null>(null);

  const results = useMemo(() => searchDataset(query), [query]);

  const handleInput = (value: string) => {
    setQuery(value);
    setSelected(null);
    // Auto-show detail for single chars
    const chars = Array.from(value);
    if (chars.length === 1) {
      setSelected(getCharInfo(chars[0]));
    }
  };

  return (
    <ToolLayout
      title="Unicode Explorer"
      description="Search and inspect Unicode characters by name, code point, or symbol"
    >
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Type a character (©), U+00A9, decimal (169), or search by name (snowflake)…"
          className="w-full px-4 py-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#333333]"
          spellCheck={false}
        />
        <p className="mt-1.5 text-xs text-[#444444]">
          Try: © · →  · ∑ · U+2603 · 9733 · &quot;arrow left&quot; · &quot;greek&quot;
        </p>
      </div>

      {/* Detail card */}
      {selected && <DetailCard info={selected} />}

      {/* Results list */}
      {!selected && (
        <div className="border border-[#222222] rounded-[8px] overflow-hidden">
          <div className="px-3 py-2 bg-[#0d0d0d] border-b border-[#222222]">
            <span className="text-xs text-[#555555]">{results.length} character{results.length !== 1 ? "s" : ""}</span>
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center text-[#444444] text-sm">No characters found</div>
          ) : (
            <div>
              {results.map((info) => (
                <button
                  key={info.codePoint}
                  onClick={() => setSelected(info)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#111111] transition-colors text-left"
                >
                  <span
                    className="text-2xl w-10 text-center shrink-0 leading-none"
                    style={{ fontFamily: "system-ui, serif" }}
                  >
                    {info.char}
                  </span>
                  <span className="font-mono text-xs text-[#a855f7] w-16 shrink-0">
                    U+{info.codePoint.toString(16).toUpperCase().padStart(4, "0")}
                  </span>
                  <span className="text-sm text-[#888888] flex-1 truncate">{info.name}</span>
                  <span className="text-xs text-[#444444] shrink-0 hidden md:block">{info.block}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back button when detail is shown */}
      {selected && (
        <button
          onClick={() => setSelected(null)}
          className="mt-2 text-xs text-[#555555] hover:text-[#888888] transition-colors"
        >
          ← Back to results
        </button>
      )}
    </ToolLayout>
  );
}
