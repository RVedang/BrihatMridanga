import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PresentationMotion } from "@/components/presentation-motion";
import "./globals.css";
import "./presentation.css";

const display = localFont({
  src: [
    { path: "./fonts/source-serif-4.woff2", weight: "200 900", style: "normal" },
    { path: "./fonts/source-serif-4-italic.woff2", weight: "200 900", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/outfit.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

const quote = localFont({
  src: "./fonts/cormorant-garamond.woff2",
  weight: "300 700",
  variable: "--font-quote",
  display: "swap",
});

const devanagari = localFont({
  src: "./fonts/noto-sans-devanagari.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brihat Mridanga · Every book, a new beginning",
    template: "%s · Brihat Mridanga",
  },
  description:
    "A shared home for book distribution, temple reports, sankirtan stories and year-round service.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${quote.variable} ${devanagari.variable}`}
    >
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PresentationMotion />
      </body>
    </html>
  );
}
