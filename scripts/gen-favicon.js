#!/usr/bin/env node
// Generates shuriken favicons using only Node.js built-ins (no packages needed)
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── PNG helpers ──────────────────────────────────────────────────────────────

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePng(size) {
  const cx = size / 2, cy = size / 2;
  const s = size / 48;

  const VHW = 5.5 * s, VHH = 22 * s;
  const HHW = 22 * s, HHH = 5.5 * s;
  const innerR = 4.3 * s;
  const rx = 8 * s;

  const inRhombus = (x, y, hw, hh) =>
    Math.abs(x - cx) / hw + Math.abs(y - cy) / hh <= 1;

  const inCenter = (x, y) =>
    (x - cx) ** 2 + (y - cy) ** 2 <= innerR ** 2;

  const grad = (x, y) => {
    const t = (x / size + (size - y) / size) / 2;
    return [
      Math.round(0x7c + t * (0xe8 - 0x7c)),
      Math.round(0x3a + t * (0x79 - 0x3a)),
      Math.round(0xed + t * (0xf9 - 0xed)),
      255,
    ];
  };

  const BG = [0x0d, 0x00, 0x20, 255];

  const rows = [];
  for (let y = 0; y < size; y++) {
    rows.push(0); // filter: None
    for (let x = 0; x < size; x++) {
      const dx = Math.max(rx - x, 0, x - (size - 1 - rx));
      const dy = Math.max(rx - y, 0, y - (size - 1 - rx));
      const inside = dx * dx + dy * dy <= rx * rx;

      if (!inside) {
        rows.push(0, 0, 0, 0);
      } else if (!inCenter(x, y) && (inRhombus(x, y, VHW, VHH) || inRhombus(x, y, HHW, HHH))) {
        rows.push(...grad(x, y));
      } else {
        rows.push(...BG);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const idat = zlib.deflateSync(Buffer.from(rows));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── ICO builder ──────────────────────────────────────────────────────────────
// Modern ICO embeds PNG blobs directly — supported by all browsers since IE 11

function makeIco(sizes) {
  const pngs = sizes.map(makePng);
  const count = sizes.length;

  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: 1 = ICO
  header.writeUInt16LE(count, 4); // number of images

  const dirSize = count * 16;
  const dirEntries = [];
  let offset = 6 + dirSize;

  for (let i = 0; i < count; i++) {
    const sz = sizes[i];
    const entry = Buffer.alloc(16);
    entry[0] = sz >= 256 ? 0 : sz;   // width  (0 = 256)
    entry[1] = sz >= 256 ? 0 : sz;   // height (0 = 256)
    entry[2] = 0;                     // color count (0 = no palette)
    entry[3] = 0;                     // reserved
    entry.writeUInt16LE(1, 4);        // planes
    entry.writeUInt16LE(32, 6);       // bit count
    entry.writeUInt32LE(pngs[i].length, 8);  // size of PNG data
    entry.writeUInt32LE(offset, 12);         // offset from file start
    offset += pngs[i].length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngs]);
}

// ── Generate files ────────────────────────────────────────────────────────────

const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });

// favicon.ico with 16, 32, 48 px sizes embedded
fs.writeFileSync(path.join(publicDir, "favicon.ico"), makeIco([16, 32, 48]));
console.log("✓ favicon.ico (16×16, 32×32, 48×48)");

// Standalone PNGs
for (const size of [48, 192]) {
  fs.writeFileSync(path.join(publicDir, `favicon-${size}.png`), makePng(size));
  console.log(`✓ favicon-${size}.png`);
}

fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), makePng(180));
console.log("✓ apple-touch-icon.png (180×180)");
