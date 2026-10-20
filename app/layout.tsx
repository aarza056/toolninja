import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { tools } from "@/lib/tools";
import Sidebar from "@/components/Sidebar";
import ParticleBackground from "@/components/ParticleBackground";
import CommandPalette from "@/components/CommandPalette";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CookieBanner from "@/components/CookieBanner";
import WhatsNewModal from "@/components/WhatsNewModal";
import AssistantRoot from "@/components/assistant/AssistantRoot";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Rounded down to the nearest 10 so the displayed count doesn't need updating every time a
// single tool is added — matches the "NN+" convention already used in TrustBar.
const TOOL_COUNT_LABEL = `${Math.floor(tools.length / 10) * 10}+`;

export const metadata: Metadata = {
  metadataBase: new URL("https://toolninja.io"),
  title: {
    default: "ToolNinja — Fast, Free Developer Tools",
    template: "%s | ToolNinja",
  },
  description:
    `Free online developer tools that run 100% in your browser. JSON formatter, Base64 encoder, JWT decoder, Regex tester, UUID generator, password generator, QR code generator, and ${TOOL_COUNT_LABEL} more. No login. Your data stays in your browser.`,
  keywords: [
    "developer tools", "json formatter", "base64 encoder", "jwt decoder",
    "regex tester", "url encoder", "uuid generator", "password generator",
    "timestamp converter", "color converter", "markdown preview", "hash generator",
    "chmod calculator", "cron expression", "qr code generator", "diff checker",
    "css gradient generator", "free online tools", "browser dev tools", "toolninja",
  ],
  authors: [{ name: "ToolNinja", url: "https://toolninja.io" }],
  creator: "ToolNinja",
  openGraph: {
    type: "website",
    siteName: "ToolNinja",
    title: "ToolNinja — Fast, Free Developer Tools",
    description:
      "Free online developer tools that run 100% in your browser. No login. Your data stays in your browser.",
    url: "https://toolninja.io",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "ToolNinja — Fast, Free Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolNinja — Fast, Free Developer Tools",
    description:
      "Free online developer tools that run 100% in your browser. No login. Your data stays in your browser.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Description, keywords, canonical and icons come from the Metadata API, per page. Hardcoding
            them here duplicates them on every page — the generic copy would win over each page's own. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        <link rel="search" type="application/opensearchdescription+xml" title="ToolNinja" href="/opensearch.xml" />
        <link rel="alternate" type="application/rss+xml" title="ToolNinja Blog" href="/blog/rss.xml" />
        <meta name="google-adsense-account" content="ca-pub-3459524040712269" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3459524040712269"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#f5f5f5]`}>
        <ParticleBackground />
        <div className="relative z-[1] flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-[240px] min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>

        <CommandPalette />
        <AssistantRoot />
        {/* Watermark */}
        <div className="fixed bottom-3 right-4 text-xs text-[#333333] pointer-events-none select-none z-50">
          🥷 ToolNinja
        </div>
        <Analytics />
        <SpeedInsights />
        <CookieBanner />
        <WhatsNewModal />
      </body>
    </html>
  );
}
