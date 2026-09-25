import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Noto_Sans_Devanagari,
  Outfit,
  Source_Serif_4,
} from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PresentationMotion } from "@/components/presentation-motion";
import "./globals.css";
import "./presentation.css";

const quote = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-quote",
  display: "swap",
});

const display = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
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
      className={`${display.variable} ${sans.variable} ${devanagari.variable} ${quote.variable}`}
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
