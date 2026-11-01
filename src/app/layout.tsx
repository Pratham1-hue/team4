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
  title: "Voyage AI — Your AI travel planner",
  description:
    "Chat with an AI travel agent, pick places you love, and get a day-by-day itinerary with live weather, maps, budgets and group collaboration.",
  keywords: ["AI travel planner", "itinerary", "trip planner", "weather", "maps", "budget"],
  authors: [{ name: "Voyage AI" }],
  openGraph: {
    title: "Voyage AI — Your AI travel planner",
    description: "Plan a whole trip in minutes with an AI agent, live weather and real maps.",
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
