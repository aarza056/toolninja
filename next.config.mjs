// `next dev` needs eval for hot reloading; production bundles don't (checked: the only Function()
// calls in the client chunks are global-object fallbacks that never run in a browser).
const isDev = process.env.NODE_ENV === 'development'

/** The site-wide CSP; `extraConnect` widens connect-src for the one page that needs it. */
const csp = (extraConnect = '') =>
  [
    "default-src 'self'",
    // 'unsafe-inline' stays for now: Next's inline RSC payload scripts on statically generated
    // pages can't carry a per-request nonce. /admin (dynamic) gets a strict nonce policy in
    // middleware.ts on top of this one.
    `script-src 'self'${isDev ? " 'unsafe-eval'" : ''} 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://csi.gstatic.com" +
      // DNS-over-HTTPS for the SPF/DKIM/DMARC checker; GitHub's API for pinning workflow actions
      " https://cloudflare-dns.com https://dns.google https://api.github.com" +
      extraConnect,
    // youtube-nocookie: video guides, loaded only after a click (components/videos/YouTubePlayer.tsx)
    "frame-src 'self' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── SECURITY HEADERS ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Nothing frames ToolNinja's own pages (the CSS-animation preview is a srcDoc iframe, which
          // neither header applies to), so both say "never": X-Frame-Options for old browsers,
          // frame-ancestors for current ones.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // The legacy XSS auditor is gone from modern browsers and was itself exploitable; 0 disables it.
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Language',
            value: 'en',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: csp(),
          },
        ],
      },
      {
        // The WebSocket tester connects to whatever ws:// or wss:// server you enter. A later entry
        // setting the same header replaces it, so only this page gets the wider connect-src.
        source: '/tools/websocket-tester',
        headers: [{ key: 'Content-Security-Policy', value: csp(' ws: wss:') }],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },

  // ── PERFORMANCE ───────────────────────────────────────────────────────────
  compress: true,

  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    // Video thumbnails: fetched by our image optimizer, so visitors never contact YouTube before pressing play
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },

  // ── REDIRECTS ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.toolninja.io' }],
        destination: 'https://toolninja.io/:path*',
        permanent: true,
      },
      // URLs that received real traffic but never existed (external links guessing at slugs)
      { source: '/tools/base64-encoder', destination: '/tools/base64', permanent: true },
      { source: '/tools/base64-decoder', destination: '/tools/base64', permanent: true },
      { source: '/tester/:slug', destination: '/tools/:slug', permanent: true },
      { source: '/tools/color-blind-test', destination: '/tools/color-blindness-simulator', permanent: true },
      { source: '/tools/tool_regex.php', destination: '/tools/regex-tester', permanent: true },
      // A mangled link Search Console found: /tools/toolninja-io/tools/xpath-tester
      { source: '/tools/toolninja-io/tools/:slug', destination: '/tools/:slug', permanent: true },
      // Names people search for that map to existing tools
      { source: '/tools/2fa-live-code', destination: '/tools/totp-generator', permanent: true },
      { source: '/tools/cidr', destination: '/tools/cidr-calculator', permanent: true },
      { source: '/tools/chmod', destination: '/tools/chmod-calculator', permanent: true },
      { source: '/tools/xpath', destination: '/tools/xpath-tester', permanent: true },
    ]
  },

}

export default nextConfig
