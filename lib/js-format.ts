export type JsParser = "babel" | "typescript";

export interface FormatOptions {
  parser: JsParser;
  semi: boolean;
  singleQuote: boolean;
  tabWidth: number;
}

export async function formatJs(code: string, options: FormatOptions): Promise<string> {
  const [{ format }, babelPlugin, estreePlugin, tsPlugin] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]);

  return format(code, {
    parser: options.parser,
    plugins: [babelPlugin.default, estreePlugin.default, tsPlugin.default],
    semi: options.semi,
    singleQuote: options.singleQuote,
    tabWidth: options.tabWidth,
  });
}

export interface MinifyResult {
  code: string;
  originalSize: number;
  minifiedSize: number;
}

export async function minifyJs(code: string): Promise<MinifyResult> {
  const { minify } = await import("terser");
  const result = await minify(code, {
    mangle: true,
    compress: true,
  });
  if (!result.code) throw new Error("Minification produced no output — check your syntax is valid JavaScript.");
  return {
    code: result.code,
    originalSize: new Blob([code]).size,
    minifiedSize: new Blob([result.code]).size,
  };
}
