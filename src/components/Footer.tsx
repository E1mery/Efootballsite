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
      <footer className="border-t border-slate-900 bg-[#050811] text-slate-500 py-6 px-4 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-300">eFootball Rwanda League (EFRL) Admin Office</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400">Commissioner Workspace</span>
          </div>
          <p className="text-slate-600">Authorized administrative personnel only. Session protected.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-800/80 bg-[#050811] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Info - Clean Gaming Logo (no picture box) */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <EfootballGamingLogo size="sm" showText={true} />
            <p className="text-xs leading-relaxed text-slate-400">
              The official competitive digital football championship in Rwanda. Empowering athletes across 3 divisions with daily 24-hour matchday cycles.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Gamepad2 className="h-4 w-4" />
              <span>eFootball Mobile Competitive Series</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-mono">
              Competitions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/standings?division=Division%201" className="hover:text-cyan-400 transition-colors">
                  Premiership (Division 1)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%202" className="hover:text-cyan-400 transition-colors">
                  Championship (Division 2)
                </Link>
              </li>
              <li>
                <Link href="/standings?division=Division%203" className="hover:text-cyan-400 transition-colors">
                  National Academy (Division 3)
                </Link>
              </li>
              <li>
                <Link href="/continental" className="hover:text-cyan-400 transition-colors">
                  eFootball UCL & Europa League
                </Link>
              </li>
              <li>
                <Link href="/fixtures" className="hover:text-cyan-400 transition-colors">
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
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  Player Login Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-cyan-400 transition-colors">
                  Season Registration
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors">
                  Admin Office (Commissioner)
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-cyan-400 transition-colors">
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
            <p className="text-xs text-slate-400 mb-3">
              Join our active gaming discord and follow our Instagram for match highlights:
            </p>
            <div className="space-y-2.5 text-xs">

              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-slate-200 transition-all group"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-cyan-400 group-hover:text-cyan-300">Join Official Discord</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-500 group-hover:text-white" />
              </a>

              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 text-slate-200 transition-all group"
              >
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                <span className="font-semibold text-pink-400 group-hover:text-pink-300">Official Instagram</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-500 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} eFootball Rwanda League (EFRL). All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Kigali, Rwanda Digital Esports Championship</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
