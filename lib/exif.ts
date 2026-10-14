export interface ExifTag {
  tag: number;
  name: string;
  value: string;
}

export interface ExifData {
  tags: ExifTag[];
  gps: { lat: number; lon: number } | null;
}

const TAG_NAMES: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x0131: "Software",
  0x0132: "DateTime",
  0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISO",
  0x920a: "FocalLength",
  0xa002: "PixelXDimension",
  0xa003: "PixelYDimension",
  0x0100: "ImageWidth",
  0x0101: "ImageHeight",
};

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readValue(view: DataView, entryValueOffset: number, type: number, count: number, little: boolean, tiffStart: number): string {
  const size = (TYPE_SIZES[type] ?? 1) * count;
  const dataOffset = size > 4 ? tiffStart + view.getUint32(entryValueOffset, little) : entryValueOffset;

  if (type === 2) {
    let str = "";
    for (let i = 0; i < count - 1; i++) {
      const code = view.getUint8(dataOffset + i);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str.trim();
  }
  if (type === 3) {
    const vals: number[] = [];
    for (let i = 0; i < count; i++) vals.push(view.getUint16(dataOffset + i * 2, little));
    return vals.join(", ");
  }
  if (type === 4) {
    const vals: number[] = [];
    for (let i = 0; i < count; i++) vals.push(view.getUint32(dataOffset + i * 4, little));
    return vals.join(", ");
  }
  if (type === 5) {
    const vals: string[] = [];
    for (let i = 0; i < count; i++) {
      const num = view.getUint32(dataOffset + i * 8, little);
      const den = view.getUint32(dataOffset + i * 8 + 4, little);
      vals.push(den === 0 ? "0" : (num / den).toFixed(4).replace(/\.?0+$/, ""));
    }
    return vals.join(", ");
  }
  return "";
}

function readRational(view: DataView, offset: number, little: boolean): number {
  const num = view.getUint32(offset, little);
  const den = view.getUint32(offset + 4, little);
  return den === 0 ? 0 : num / den;
}

function parseDMS(view: DataView, offset: number, little: boolean): number {
  const deg = readRational(view, offset, little);
  const min = readRational(view, offset + 8, little);
  const sec = readRational(view, offset + 16, little);
  return deg + min / 60 + sec / 3600;
}

function parseGpsIfd(view: DataView, gpsIfdOffset: number, tiffStart: number, little: boolean): { lat: number; lon: number } | null {
  const numEntries = view.getUint16(gpsIfdOffset, little);
  let latRef = "N";
  let lonRef = "E";
  let lat: number | null = null;
  let lon: number | null = null;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = gpsIfdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, little);
    const valueOffset = entryOffset + 8;

    if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(valueOffset));
    else if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(valueOffset));
    else if (tag === 0x0002 || tag === 0x0004) {
      const dataOffset = tiffStart + view.getUint32(valueOffset, little);
      const dms = parseDMS(view, dataOffset, little);
      if (tag === 0x0002) lat = dms;
      else lon = dms;
    }
  }

  if (lat === null || lon === null) return null;
  return { lat: latRef === "S" ? -lat : lat, lon: lonRef === "W" ? -lon : lon };
}

function parseTiff(view: DataView, tiffStart: number): ExifData {
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949;
  const firstIfdOffset = view.getUint32(tiffStart + 4, little);

  const tags: ExifTag[] = [];
  let gpsIfdOffset: number | null = null;

  const ifdOffset = tiffStart + firstIfdOffset;
  const numEntries = view.getUint16(ifdOffset, little);
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, little);
    const type = view.getUint16(entryOffset + 2, little);
    const count = view.getUint32(entryOffset + 4, little);
    const valueOffset = entryOffset + 8;

    if (tag === 0x8825) {
      gpsIfdOffset = tiffStart + view.getUint32(valueOffset, little);
      continue;
    }

    const name = TAG_NAMES[tag];
    if (name) {
      try {
        const value = readValue(view, valueOffset, type, count, little, tiffStart);
        if (value) tags.push({ tag, name, value });
      } catch {
        // malformed entry — skip rather than fail the whole parse
      }
    }
  }

  let gps: { lat: number; lon: number } | null = null;
  if (gpsIfdOffset !== null) {
    try {
      gps = parseGpsIfd(view, gpsIfdOffset, tiffStart, little);
    } catch {
      gps = null;
    }
  }

  return { tags, gps };
}

/** Walks a JPEG's marker segments looking for APP1/"Exif\0\0" and parses its embedded TIFF
 * structure. Returns null for a non-JPEG file or one with no EXIF segment at all. */
export function parseExif(buffer: ArrayBuffer): ExifData | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 8 <= view.byteLength) {
      const header = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5),
        view.getUint8(offset + 6), view.getUint8(offset + 7)
      );
      if (header === "Exif") {
        try {
          return parseTiff(view, offset + 10);
        } catch {
          return null;
        }
      }
    }
    offset += 2 + length;
  }
  return null;
}

/** Removes every APP1 segment (EXIF and, since they share the same marker, XMP metadata too) from
 * a JPEG, leaving image data untouched. Returns the input unchanged if it isn't a JPEG. */
export function stripExif(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return buffer;

  const segments: { start: number; end: number }[] = [{ start: 0, end: 2 }];
  let offset = 2;

  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);

    if (marker === 0xd9) {
      segments.push({ start: offset, end: offset + 2 });
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      segments.push({ start: offset, end: offset + 2 });
      offset += 2;
      continue;
    }

    const length = view.getUint16(offset + 2);
    const segEnd = offset + 2 + length;
    if (marker !== 0xe1) segments.push({ start: offset, end: segEnd });

    if (marker === 0xda) {
      segments.push({ start: segEnd, end: view.byteLength });
      break;
    }
    offset = segEnd;
  }

  const totalLen = segments.reduce((sum, s) => sum + (s.end - s.start), 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const seg of segments) {
    out.set(new Uint8Array(buffer, seg.start, seg.end - seg.start), pos);
    pos += seg.end - seg.start;
  }
  return out.buffer;
}
