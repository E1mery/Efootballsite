import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <body className="bg-[#060911] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        {/* Subtle background ambient mesh */}
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,161,222,0.15),rgba(250,210,1,0.05),transparent)]" />
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_60%_60%_at_80%_80%,rgba(16,185,129,0.08),transparent)]" />
        
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
