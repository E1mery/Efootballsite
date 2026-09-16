"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Trophy, Calendar, Users, Award, Shield, Menu, X, Flame, ShieldAlert, Globe, Smartphone, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    { name: "Player Dashboard", href: "/dashboard", icon: Smartphone },
    { name: "Admin Center", href: "/admin", icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      {/* Rwandan Esports Color Ribbon */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/2 bg-[#00A1DE]" />
        <div className="h-full w-1/4 bg-[#FAD201]" />
        <div className="h-full w-1/4 bg-[#10B981]" />
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-emerald-500 p-[2px] shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Smartphone className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white uppercase group-hover:text-sky-400 transition-colors">
                EFOOTBALL RWANDA
              </span>
              <Badge variant="live" className="text-[9px] py-0 px-1.5 uppercase font-mono">
                MOBILE ONLY
              </Badge>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-1 flex items-center gap-1">
              <span>Div 1 • Div 2 • Div 3</span>
              <span>•</span>
              <span className="text-yellow-400">24-Hr Matchdays</span>
            </p>
          </div>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-400 shadow-inner border border-sky-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
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
