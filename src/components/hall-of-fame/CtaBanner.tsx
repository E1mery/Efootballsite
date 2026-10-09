"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, Zap, Sparkles } from "lucide-react";
import { BRANDING_ASSETS } from "@/lib/assets.config";

interface CtaBannerProps {
  currentSeasonName?: string;
  currentSeasonLink?: string;
}

export default function CtaBanner({
  currentSeasonName = "Current Season",
  currentSeasonLink = "/standings",
}: CtaBannerProps) {
  return (
    <section className="py-12 sm:py-16">
      <div className="relative rounded-3xl overflow-hidden border border-secondary/40 hof-gold-card p-8 sm:p-12 lg:p-16 text-center">
        {/* Subtle stadium light vignette */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-20">
          <Image
            src={BRANDING_ASSETS.carouselStadiumBg}
            alt="Stadium background"
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>

        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none -z-10" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/30">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-xs font-black uppercase tracking-widest text-secondary">
              JOIN THE PANTHEON
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground font-sans">
              YOUR NAME COULD BE HERE.
            </h2>
            <p className="text-sm sm:text-base font-semibold text-secondary uppercase tracking-widest">
              Compete. Win. Make History.
            </p>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every match is verified and calculated into the official national records. Rise through the divisions and immortalize your legacy in the Rwanda eFootball Hall of Fame.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={currentSeasonLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-secondary hover:bg-secondary/90 text-black font-black uppercase text-xs tracking-wider shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all hover:scale-105"
            >
              <Trophy className="w-4 h-4" />
              <span>View {currentSeasonName}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/matches"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-card/80 hover:bg-card border border-border/80 hover:border-secondary/50 text-foreground font-bold uppercase text-xs tracking-wider transition-all"
            >
              <Zap className="w-4 h-4 text-secondary" />
              <span>Fixtures & Results</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
