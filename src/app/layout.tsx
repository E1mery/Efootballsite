import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import ChunkErrorRecovery from "@/components/ChunkErrorRecovery";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Efootball Rwanda League (EFRL) | Official Esports Championship",
  description:
    "The official portal of the Efootball Rwanda League. Live scores, standings, team rosters, top scorers, and national esports tournament registration.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white">
        {/* Subtle background ambient mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-hero-glow" />
        <ChunkErrorRecovery />
        
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
