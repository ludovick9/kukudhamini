import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { DialogAccessibility } from "@/components/dialog-accessibility";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KukuDhamini | Your Broiler Farm Guardian",
  applicationName: "KukuDhamini",
  description: "Poultry management and chicken farming application",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "KukuDhamini",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#176b3b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head><Script id="theme-bootstrap" strategy="beforeInteractive">{`(() => { try { const t = localStorage.getItem('kukudhamini-theme') || 'light'; const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = t; document.documentElement.dataset.systemDark = dark ? 'true' : 'false'; document.documentElement.style.colorScheme = t === 'system' ? 'light dark' : t; } catch (_) {} })()`}</Script></head>
      <body className="min-h-full flex flex-col"><ThemeProvider><LanguageProvider><DialogAccessibility />{children}</LanguageProvider></ThemeProvider></body>
    </html>
  );
}
