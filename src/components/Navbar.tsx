"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Trophy, Shield, Menu, X, ShieldAlert, Globe, User, LogIn, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";

export default function Navbar() {
  const pathname = usePathname();
  const isAdminPortal = pathname?.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean; user?: any; player?: any } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("efrl_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            authenticated: true,
            user: parsed,
            player: parsed.player,
          };
        }
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    // 1. Immediately hydrate from localStorage to prevent flash of "Log In" on refresh
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("efrl_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSession({
            authenticated: true,
            user: parsed,
            player: parsed.player,
          });
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // 2. Fetch fresh session from server
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSession(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("efrl_user", JSON.stringify({ ...data.user, player: data.player }));
          }
        } else {
          setSession({ authenticated: false });
          if (typeof window !== "undefined") {
            localStorage.removeItem("efrl_user");
          }
        }
      })
      .catch(() => {
        // keep cached session if network hiccup
      });
  }, [pathname]);

  useEffect(() => {
    // If admin is authenticated, restrict navigation strictly to /admin
    if (session?.authenticated && session.user?.role === "ADMIN" && !pathname?.startsWith("/admin")) {
      window.location.replace("/admin");
    }
  }, [session, pathname]);

  const isUserPortal = pathname?.startsWith("/dashboard");
  const isInsidePortal = Boolean(isUserPortal || isAdminPortal);
  const isUserOrAdminLoggedIn = Boolean(
    session?.authenticated || isInsidePortal
  );

  const navLinks = isUserOrAdminLoggedIn
    ? [{ name: "Home", href: "/", icon: Shield }]
    : [
        { name: "Home", href: "/", icon: Shield },
        { name: "Fixtures", href: "/fixtures", icon: Calendar },
        { name: "3 Divisions", href: "/standings", icon: Trophy },
        { name: "UCL & Europa", href: "/continental", icon: Globe },
        { name: "Admin Office", href: "/admin", icon: ShieldAlert },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#060913]/95 backdrop-blur-xl transition-all">
      {/* Sleek Cyan / Gold Esports Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-amber-400 opacity-80" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Gaming Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3">
          <Link href={isAdminPortal ? "/admin" : (session?.authenticated ? "/dashboard" : "/")} className="flex items-center gap-3 group">
            <EfootballGamingLogo size="md" showText={true} />
          </Link>
          {isAdminPortal && (
            <Badge variant="destructive" className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 ml-1 hidden sm:inline-flex font-bold">
              COMMISSIONER OFFICE
            </Badge>
          )}
        </div>

        {/* Desktop Navigation Links (HIDDEN in Admin and User Portals) */}
        {!isInsidePortal && (
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
        )}

        {/* Right Action Bar */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAdminPortal ? (
            /* Inside Admin Portal: Clean Header without any public portal links */
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="font-mono text-xs tracking-wider uppercase px-3 py-1 font-bold shadow-md shadow-red-600/20">
                COMMISSIONER CONSOLE
              </Badge>
            </div>
          ) : session?.authenticated ? (
            session.user?.role === "ADMIN" ? (
              <Link href="/admin">
                <Button variant="destructive" size="sm" className="font-black text-xs gap-1.5 shadow-md shadow-red-600/20">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Admin Office</span>
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="yellow" size="sm" className="font-black text-xs gap-1.5 shadow-md shadow-yellow-500/20">
                  <User className="h-3.5 w-3.5" />
                  <span>{session.player?.gamerTag || "Player Dashboard"}</span>
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 border-slate-700 text-slate-200 hover:text-white">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Log In</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="yellow" size="sm" className="font-black text-xs text-slate-950 shadow-md shadow-yellow-500/20">
                  <span>Register</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle & quick action (HIDDEN in Admin and User Portals) */}
        {!isInsidePortal && (
          <div className="flex items-center gap-2 lg:hidden">
            {session?.authenticated ? (
              <Link href={session.user?.role === "ADMIN" ? "/admin" : "/dashboard"}>
                <Button
                  size="sm"
                  variant={session.user?.role === "ADMIN" ? "destructive" : "yellow"}
                  className="h-8 px-2.5 text-[11px] font-black"
                >
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span className="max-w-[75px] truncate">
                    {session.player?.gamerTag || (session.user?.role === "ADMIN" ? "Admin" : "Portal")}
                  </span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-[11px] font-bold border-slate-700 text-slate-200"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  <span>Log In</span>
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-h-[40px] min-w-[40px]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && !isInsidePortal && (
        <div className="lg:hidden border-b border-slate-800 bg-[#060913]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
            <>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                      isActive
                        ? "bg-slate-800/80 text-cyan-400 border border-cyan-500/30"
                        : "text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-cyan-400" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-800/80 space-y-2">

                {session?.authenticated ? (
                  session.user?.role === "ADMIN" ? (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="destructive" className="w-full text-xs font-black min-h-[44px]">
                        Open Admin Office
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="yellow" className="w-full text-xs font-black min-h-[44px]">
                        My Player Dashboard ({session.player?.gamerTag || "Profile"})
                      </Button>
                    </Link>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full text-xs font-bold min-h-[44px]">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="yellow" className="w-full text-xs font-black min-h-[44px]">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
        </div>
      )}
    </header>
  );
}

