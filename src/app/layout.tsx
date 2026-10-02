import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hanela | Remeselné koláčiky a torty Viničné & Slovenský Grob",
  description:
    "Poctivé remeselné torty, víkendové degustačné mixy a svadobné výslužky bez kompromisov. Čistý dizajn, pravé mascarpone a belgická čokoláda.",
  keywords: [
    "Hanela",
    "remeselné koláče",
    "torty na mieru",
    "Viničné",
    "Slovenský Grob",
    "víkendový mix",
    "svadobné výslužky",
  ],
  authors: [{ name: "Hanela s.r.o." }],
  openGraph: {
    title: "Hanela | Poctivé remeselné koláčiky a torty",
    description:
      "Čistý dizajn, prémiová belgická čokoláda a pravé mascarpone. Zákazková výroba vo Viničnom a Slovenskom Grobe.",
    type: "website",
    locale: "sk_SK",
    siteName: "Hanela – koláčiky a torty",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e131d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" className={`${inter.variable} ${lora.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#F9F8F5] text-[#1e131d] selection:bg-[#aa5ca5]/30 selection:text-[#1e131d]">
        {children}
      </body>
    </html>
  );
}
