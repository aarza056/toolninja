export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeEditorData: boolean;
  removeEmptyGroups: boolean;
  removeDimensions: boolean;
  precision: number;
  minifyWhitespace: boolean;
}

export const DEFAULT_SVG_OPTIONS: SvgOptimizeOptions = {
  removeComments: true,
  removeMetadata: true,
  removeEditorData: true,
  removeEmptyGroups: true,
  removeDimensions: false,
  precision: 2,
  minifyWhitespace: true,
};

export function optimizeSvg(svg: string, opts: SvgOptimizeOptions): string {
  let out = svg;

  // Strip XML declaration and DOCTYPE — unnecessary for inline/web use
  out = out.replace(/<\?xml[^?]*\?>\s*/gi, "");
  out = out.replace(/<!DOCTYPE[^>[]*(\[[^\]]*\])?[^>]*>\s*/gi, "");

  if (opts.removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, "");
  }

  if (opts.removeMetadata) {
    out = out.replace(/<metadata[\s\S]*?<\/metadata>\s*/gi, "");
    out = out.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, "");
    out = out.replace(/<desc[^>]*>[\s\S]*?<\/desc>\s*/gi, "");
  }

  if (opts.removeEditorData) {
    out = out.replace(/<sodipodi:namedview[\s\S]*?(\/>|<\/sodipodi:namedview>)\s*/gi, "");
    out = out.replace(/<inkscape:[\s\S]*?(\/>|<\/inkscape:[a-zA-Z]+>)\s*/gi, "");
    out = out.replace(/\s(inkscape|sodipodi):[a-zA-Z-]+="[^"]*"/g, "");
    out = out.replace(/\sxmlns:(inkscape|sodipodi)="[^"]*"/g, "");
  }

  if (opts.removeDimensions) {
    out = out.replace(/\s(width|height)="[^"]*"/g, "");
  }

  if (opts.removeEmptyGroups) {
    let prev: string;
    do {
      prev = out;
      out = out.replace(/<g[^>]*>\s*<\/g>/g, "");
    } while (out !== prev);
  }

  if (opts.precision >= 0) {
    out = out.replace(/-?\d+\.\d+/g, (match) => {
      const num = Number(match);
      return String(Number(num.toFixed(opts.precision)));
    });
  }

  if (opts.minifyWhitespace) {
    out = out.replace(/>\s+</g, "><");
    out = out.replace(/\s{2,}/g, " ");
    out = out.replace(/\n/g, "");
  }

  return out.trim();
}

export function svgByteSize(svg: string): number {
  return new TextEncoder().encode(svg).length;
}
