import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BidShield AI - Bid Compliance Verification Platform",
  description:
    "AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement. Automated tender rule extraction, cross-document consistency checking, and compliance verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

