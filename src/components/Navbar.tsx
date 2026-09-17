"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Trophy, Calendar, Users, Award, Shield, Menu, X, Flame, ShieldAlert, Globe, Smartphone, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean; player?: any } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/", icon: Shield },
    { name: "3 Divisions", href: "/standings", icon: Trophy },
    { name: "UCL & Europa", href: "/continental", icon: Globe },
    { name: "Admin Office", href: "/admin", icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl transition-all">
      {/* Sleek Cyan / Gold Esports Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-amber-400 opacity-80" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Gaming Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <EfootballGamingLogo size="md" showText={true} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 shadow-inner border border-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {session?.authenticated ? (
            <Link href="/dashboard">
              <Button variant="yellow" size="sm" className="font-black text-xs gap-1.5">
                <User className="h-3.5 w-3.5" />
                {session.player?.gamerTag || "My Dashboard"}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="yellow" size="sm" className="font-bold text-xs">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-400 border border-sky-500/30"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full text-xs font-bold">
                Log In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="yellow" className="w-full text-xs font-bold">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
