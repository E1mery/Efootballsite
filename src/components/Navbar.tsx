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
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl transition-all">
      {/* Sleek Cyan / Gold Esports Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-secondary opacity-80" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Gaming Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3">
          <Link href={isAdminPortal ? "/admin" : (session?.authenticated ? "/dashboard" : "/")} className="flex items-center gap-3 group">
            <EfootballGamingLogo size="md" showText={true} />
          </Link>
          {isAdminPortal && (
            <Badge variant="yellow" className="font-mono text-xs tracking-wider uppercase px-2 py-0.5 ml-1 hidden sm:inline-flex font-bold">
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
                      ? "bg-primary/10 text-primary shadow-inner border border-primary/30"
                      : "text-foreground hover:text-white hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
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
              <Badge variant="yellow" className="font-mono text-xs tracking-wider uppercase px-3 py-1 font-bold shadow-md">
                COMMISSIONER CONSOLE
              </Badge>
            </div>
          ) : session?.authenticated ? (
            session.user?.role === "ADMIN" ? (
              <Link href="/admin">
                <Button variant="yellow" size="sm" className="font-black text-xs gap-1.5 shadow-md">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Admin Office</span>
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="yellow" size="sm" className="font-black text-xs gap-1.5 shadow-md">
                  <User className="h-3.5 w-3.5" />
                  <span>{session.player?.gamerTag || "Player Dashboard"}</span>
                </Button>
              </Link>
            )
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 border-border text-foreground hover:text-white">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Log In</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
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
                  variant={session.user?.role === "ADMIN" ? "yellow" : "yellow"}
                  className="h-8 px-2.5 text-xs font-black"
                >
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span className="w-20 truncate">
                    {session.player?.gamerTag || (session.user?.role === "ADMIN" ? "Admin" : "Portal")}
                  </span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs font-bold border-border text-foreground"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  <span>Log In</span>
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-muted h-10 w-10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && !isInsidePortal && (
        <div className="lg:hidden border-b border-border bg-background/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
            <>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all h-11 ${
                      isActive
                        ? "bg-muted/80 text-primary border border-primary/30"
                        : "text-foreground hover:bg-card"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-border/80 space-y-2">

                {session?.authenticated ? (
                  session.user?.role === "ADMIN" ? (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="yellow" className="w-full text-xs font-black h-11">
                        Open Admin Office
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="yellow" className="w-full text-xs font-black h-11">
                        My Player Dashboard ({session.player?.gamerTag || "Profile"})
                      </Button>
                    </Link>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full text-xs font-bold h-11">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button  className="w-full text-xs font-black h-11">
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

