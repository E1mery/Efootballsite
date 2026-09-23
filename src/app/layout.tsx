import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Efootball Rwanda League (EFRL) | Official Esports Championship",
  description:
    "The official portal of the Efootball Rwanda League. Live scores, standings, team rosters, top scorers, and national esports tournament registration.",
  keywords: [
    "eFootball Rwanda",
    "Rwanda Esports",
    "Kigali eFootball",
    "Kigali Titans",
    "Rayon Sports eClub",
    "APR eSports",
    "African Gaming",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white">
        {/* Subtle background ambient mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-hero-glow" />
        <div className="fixed inset-0 pointer-events-none -z-10 bg-ambient-success" />
        
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
