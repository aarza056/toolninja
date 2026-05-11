import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ParticleBackground from "@/components/ParticleBackground";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://toolninja.io"),
  title: {
    default: "ToolNinja — Fast, Free Developer Tools",
    template: "%s | ToolNinja",
  },
  description:
    "Free online developer tools that run 100% in your browser. JSON formatter, Base64 encoder, JWT decoder, Regex tester, UUID generator, password generator, QR code generator, and 20+ more. No login, no tracking.",
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
      "Free online developer tools that run 100% in your browser. No login, no tracking, no nonsense.",
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
      "Free online developer tools that run 100% in your browser. No login, no tracking.",
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
  alternates: {
    canonical: "https://toolninja.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#f5f5f5]`}>
        <ParticleBackground />
        <div className="relative z-[1] flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-[240px] min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Watermark */}
        <div className="fixed bottom-3 right-4 text-xs text-[#333333] pointer-events-none select-none z-50">
          🥷 ToolNinja
        </div>
      </body>
    </html>
  );
}
