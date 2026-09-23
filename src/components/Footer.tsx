"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Shield, Gamepad2, Heart, ExternalLink } from "lucide-react";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";

export default function Footer() {
  const pathname = usePathname();
  const isAdminPortal = pathname?.startsWith("/admin");

  if (isAdminPortal) {
    return (
      <footer className="border-t border-border bg-background text-muted-foreground py-6 px-4 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="font-bold text-foreground">eFootball Rwanda League (EFRL) Admin Office</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-muted-foreground">Commissioner Workspace</span>
          </div>
          <p className="text-muted-foreground">Authorized administrative personnel only. Session protected.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border/80 bg-background text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Info - Clean Gaming Logo (no picture box) */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <EfootballGamingLogo size="sm" showText={true} />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">
              Competitions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/standings?division=Division%201" className="hover:text-primary transition-colors">
                  Premiership (Division 1)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%202" className="hover:text-primary transition-colors">
                  Championship (Division 2)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%203" className="hover:text-primary transition-colors">
                  National Academy (Division 3)
                </Link>
              </li>
              <li>
                <Link href="/continental" className="hover:text-primary transition-colors">
                  eFootball UCL & Europa League
                </Link>
              </li>
              <li>
                <Link href="/fixtures" className="hover:text-primary transition-colors">
                  Daily Matchday Fixtures
                </Link>
              </li>
            </ul>
          </div>

          {/* External Resources & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">
              External Resources & Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Player Login Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Season Registration
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Admin Office (Commissioner)
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-primary transition-colors">
                  Live Standings & Tables
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect & Social Media */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">
              Official Community & Socials
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Join our active gaming discord and follow our Instagram for match highlights:
            </p>
            <div className="space-y-2.5 text-xs">

              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-muted/80 text-foreground transition-all group"
              >
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold text-primary group-hover:text-primary">Join Official Discord</span>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-white" />
              </a>

              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-muted/80 text-foreground transition-all group"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-semibold text-primary group-hover:text-primary">Official Instagram</span>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} eFootball Rwanda League (EFRL). All rights reserved.</p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Kigali, Rwanda Digital Esports Championship</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
