"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Shield, Gamepad2, Heart, ExternalLink } from "lucide-react";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";

export default function Footer() {
  const pathname = usePathname();
  const isAdminPortal = pathname?.startsWith("/admin");
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return null;
  }

  if (isAdminPortal) {
    return (
      <footer className="border-t border-border bg-background text-muted-foreground py-6 px-4 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-bold text-foreground">eFootball Rwanda League (EFRL) Admin Office</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-muted-foreground">Commissioner Workspace</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-secondary">CAT (UTC+2)</span>
          </div>
          <p className="text-muted-foreground">Official Platform Time: Central Africa Time (Kigali, UTC+2). Session protected.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative z-10 border-t border-border/80 bg-background text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Official Community & Social Channels Banner (Compact) */}
        {!isDashboard && (
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-secondary font-mono">
                Official Community & Social Channels
              </h3>
              <p className="text-xs text-foreground max-w-2xl leading-relaxed">
                Connect with Rwandan esports athletes, find match opponents on Discord, and view match highlights on our official Instagram channel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* WhatsApp Community Link */}
              <a
                href="https://chat.whatsapp.com/DeeXZ0LWLhAGq81OtTaVZQ"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/80 text-foreground text-xs font-semibold transition-all shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span>WhatsApp</span>
                <ExternalLink className="h-3 w-3 text-foreground/60 group-hover:text-secondary shrink-0" />
              </a>

              {/* Discord Link */}
              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/80 text-foreground text-xs font-semibold transition-all shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span>Discord</span>
                <ExternalLink className="h-3 w-3 text-foreground/60 group-hover:text-secondary shrink-0" />
              </a>

              {/* Instagram Link */}
              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/80 text-foreground text-xs font-semibold transition-all shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span>Instagram</span>
                <ExternalLink className="h-3 w-3 text-foreground/60 group-hover:text-secondary shrink-0" />
              </a>
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <EfootballGamingLogo size="sm" showText={true} />
            <p className="text-xs text-foreground leading-relaxed max-w-sm">
              Rwanda&apos;s premier competitive eFootball gaming championship. Organizing national leagues, digital cups, and esports athlete development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 font-mono">
              Competitions
            </h4>
            <ul className="space-y-2 text-xs text-foreground">
              <li>
                <Link href="/standings?division=Division%201" className="hover:text-secondary transition-colors">
                  Premiership (Division 1)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%202" className="hover:text-secondary transition-colors">
                  Championship (Division 2)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%203" className="hover:text-secondary transition-colors">
                  National Academy (Division 3)
                </Link>
              </li>
              <li>
                <Link href="/continental" className="hover:text-secondary transition-colors">
                  eFootball UCL & Europa League
                </Link>
              </li>
              <li>
                <Link href="/fixtures" className="hover:text-secondary transition-colors">
                  Daily Matchday Fixtures
                </Link>
              </li>
            </ul>
          </div>

          {/* External Resources & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 font-mono">
              External Resources & Portals
            </h4>
            <ul className="space-y-2 text-xs text-foreground">
              <li>
                <Link href="/login" className="hover:text-secondary transition-colors">
                  Login Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-secondary transition-colors">
                  Season Registration
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-secondary transition-colors">
                  Live Standings & Tables
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p className="text-foreground">© {new Date().getFullYear()} <span className="font-semibold text-secondary">eFootball Rwanda League (EFRL).</span> All rights reserved.</p>
          <div className="flex items-center gap-1 text-foreground">
            <span>Kigali, Rwanda Digital Esports Championship</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
