import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { LangProvider } from "@/components/i18n/LangProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Next.js 16：themeColor 要搬去 viewport export
export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export const metadata: Metadata = {
  title: "Helper Notes",
  description: "Simple daily expense notes for helpers and families",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Helper Notes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className={`${inter.className} ${geistSans.variable} ${geistMono.variable}`}>
        {/* ✅ global language state */}
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}