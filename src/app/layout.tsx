import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yatri — Plan once. Travel together.",
  description:
    "Your intelligent travel copilot with encrypted Travel Vault, live flight & train tracking, weather-smart packing, and group expense splitting.",
  keywords: ["Yatri", "travel app", "AI travel planner", "travel vault", "train tracking", "flight status", "expense split"],
  authors: [{ name: "Yatri" }],
  openGraph: {
    title: "Yatri — Plan once. Travel together.",
    description: "Your intelligent travel copilot with secure vault, live transit tracking, and group planning.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#050a14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body>
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
