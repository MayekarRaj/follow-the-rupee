import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Inter, Noto_Sans_Devanagari } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowHost from "@/components/HowHost";
import SkipLink from "@/components/SkipLink";
import { PrefsProvider } from "@/lib/prefs";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const deva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari", "latin"],
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
      className={`${fraunces.variable} ${inter.variable} ${deva.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <PrefsProvider>
          <SkipLink />
          <Suspense
            fallback={<div className="h-[86px] rule-double bg-paper" />}
          >
            <Header />
          </Suspense>
          <div className="flex-1">{children}</div>
          <Footer />
          <HowHost />
        </PrefsProvider>
      </body>
    </html>
  );
}
