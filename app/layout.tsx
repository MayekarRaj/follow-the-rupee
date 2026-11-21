import type { Metadata } from "next";
import { Suspense } from "react";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  IBM_Plex_Serif,
} from "next/font/google";
import TopBar from "@/components/TopBar";
import { NavDrawerHost, Sidebar } from "@/components/NavPanel";
import Footer from "@/components/Footer";
import HowHost from "@/components/HowHost";
import SkipLink from "@/components/SkipLink";
import { PrefsProvider } from "@/lib/prefs";
import "./globals.css";

// UI text and headings.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Marathi / Hindi. Includes latin so mixed text stays in one family.
const plexDeva = IBM_Plex_Sans_Devanagari({
  variable: "--font-plex-deva",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Only for large ₹ figures and KPI numbers.
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Follow the Rupee",
  description:
    "Mumbai monsoon road-repair spend, traced from complaint to rupee. Synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexDeva.variable} ${plexSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <PrefsProvider>
          <SkipLink />
          <div className="flex min-h-screen">
            <Suspense fallback={<div className="hidden w-60 shrink-0 border-r-2 border-ink lg:block" />}>
              <Sidebar />
            </Suspense>
            <div className="flex min-w-0 flex-1 flex-col">
              <Suspense fallback={<div className="h-[66px] border-b-2 border-ink bg-paper" />}>
                <TopBar />
              </Suspense>
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </div>
          <Suspense>
            <NavDrawerHost />
          </Suspense>
          <HowHost />
        </PrefsProvider>
      </body>
    </html>
  );
}
