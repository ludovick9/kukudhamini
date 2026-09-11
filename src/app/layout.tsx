import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { DialogAccessibility } from "@/components/dialog-accessibility";
import { InertControlGuard } from "@/components/inert-control-guard";

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
  description: "A clear, calm command center for broiler farm management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head><Script id="theme-bootstrap" strategy="beforeInteractive">{`(() => { try { const t = localStorage.getItem('kukudhamini-theme') || 'light'; const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = t; document.documentElement.dataset.systemDark = dark ? 'true' : 'false'; document.documentElement.style.colorScheme = t === 'system' ? 'light dark' : t; } catch (_) {} })()`}</Script></head>
      <body className="min-h-full flex flex-col"><ThemeProvider><LanguageProvider><DialogAccessibility /><InertControlGuard />{children}</LanguageProvider></ThemeProvider></body>
    </html>
  );
}
