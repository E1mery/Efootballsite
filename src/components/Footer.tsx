import Link from "next/link";
import { Trophy, Shield, Gamepad2, Send, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-emerald-500 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <span className="text-sm font-black text-white">
                    EF<span className="text-yellow-400">R</span>
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-white uppercase tracking-wider">
                EFOOTBALL RWANDA
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The official competitive digital football league in Rwanda. Empowering the youth, celebrating talent, and representing Rwanda on the global esports stage.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Gamepad2 className="h-4 w-4" />
              <span>Mobile & Console Tournament Series</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
              Competitions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/standings" className="hover:text-sky-400 transition-colors">
                  EFRL Premiership Division 1
                </Link>
              </li>
              <li>
                <Link href="/fixtures" className="hover:text-sky-400 transition-colors">
                  Matchday Results & Schedules
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-sky-400 transition-colors">
                  Kigali Super Cup
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-sky-400 transition-colors">
                  National Qualifiers 2026
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Venues */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
              Hubs & Venues
            </h4>
            <ul className="space-y-2 text-xs">
              <li>BK Arena Esports Lounge, Remera</li>
              <li>Nyamirambo Youth Center</li>
              <li>Rubavu Lake Kivu Gaming Center</li>
              <li>Musanze Volcano Hub</li>
              <li>Huye University Campus</li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
              Official Channels
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Follow live tournament broadcasts and player highlight reels.
            </p>
            <div className="space-y-2 text-xs">
              <div className="text-slate-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>Twitch: @efootball_rwanda</span>
              </div>
              <div className="text-slate-300">YouTube: Rwanda Esports TV</div>
              <div className="text-slate-300">Twitter / X: @EfootballRwanda</div>
              <div className="text-slate-300">Email: league@efootball.rw</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Efootball Rwanda League (EFRL). All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with passion in Kigali, Rwanda</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
